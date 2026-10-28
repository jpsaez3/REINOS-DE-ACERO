import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.addInitScript(() => {
    Date.now = () => 2026;
  });
  await page.goto("http://127.0.0.1:5173");
  await page.screenshot({
    path: "/tmp/reinos-menu-ilustrado.png",
    fullPage: true,
  });
  for (const name of ["heroes.png", "paso-ceniza.png", "terrain.png"]) {
    const loaded = await page.evaluate(async (name) => {
      const image = new Image();
      image.src = "/art/" + name;
      await image.decode();
      return image.naturalWidth > 500;
    }, name);
    assert.equal(loaded, true);
  }
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  assert.equal(await page.locator(".creation .portrait.large").count(), 4);
  for (let i = 0; i < 4; i++)
    await page
      .locator(".creation .card")
      .nth(i)
      .getByLabel("Clase", { exact: true })
      .selectOption("Mago");
  await page.getByRole("button", { name: "Entrar en el Paso Ceniza" }).click();
  let cast = false;
  for (let i = 0; i < 100 && !cast; i++) {
    const plan = await page.evaluate(async () => {
      const E = await import("/src/engine.ts");
      const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
      if (!g || g.result !== "playing") return { wait: true };
      const u = E.active(g);
      if (u.team === "enemy") return { wait: true };
      const foes = g.units.filter((v) => v.team === "enemy" && v.hp > 0);
      let best,
        score = -Infinity;
      for (const path of E.reachable(g, u).values()) {
        const p = path.at(-1) ?? u;
        const target = foes.find(
          (t) => E.distance(p, t) <= 5 && E.lineOfSight(p, t),
        );
        const s =
          (target ? 100 : 0) -
          Math.min(...foes.map((t) => E.distance(p, t))) -
          path.length * 0.1;
        if (s > score) {
          score = s;
          best = {
            p,
            move: E.distance(p, u) > 0,
            target: target ? { x: target.x, y: target.y } : null,
          };
        }
      }
      return best;
    });
    if (plan.wait) {
      await page.waitForTimeout(60);
      continue;
    }
    if (plan.move)
      await page
        .getByRole("gridcell", { name: `${plan.p.x},${plan.p.y}`, exact: true })
        .click();
    if (plan.target) {
      await page
        .locator(".actions button")
        .filter({ hasText: "Orbe de fuego" })
        .click();
      const target = page.getByRole("gridcell", {
        name: new RegExp(`^${plan.target.x},${plan.target.y} `),
      });
      await target.hover();
      assert.ok((await page.locator(".area-preview").count()) > 1);
      assert.match(await page.locator(".target-preview").innerText(), /100%/);
      await page.screenshot({
        path: "/tmp/reinos-area-ilustrada.png",
        fullPage: true,
      });
      const before = await page.evaluate(() => {
        const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
        return g.units.find((v) => v.id === g.order[g.turn]).resource;
      });
      await target.click();
      assert.ok((await page.locator(".combat-float").count()) > 0);
      const after = await page.evaluate(() => {
        const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
        return g.units.find((v) => v.id === g.order[g.turn]).resource;
      });
      assert.equal(after, before - 2);
      cast = true;
    } else await page.getByRole("button", { name: "Finalizar turno" }).click();
  }
  assert.equal(cast, true);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      portraits: 4,
      artDecoded: true,
      areaPreview: true,
      castViaUI: true,
      resourceCost: 2,
      damageFeedback: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
