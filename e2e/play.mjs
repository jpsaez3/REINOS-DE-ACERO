import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.addInitScript(() => {
    Date.now = () => 2026;
  });
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  assert.equal(await page.locator(".creation .card").count(), 4);
  await page
    .locator(".creation .card")
    .nth(2)
    .getByLabel("Raza", { exact: true })
    .selectOption("Enano");
  await page.getByRole("button", { name: "Entrar en el Paso Ceniza" }).click();
  await page.waitForFunction(() => localStorage.getItem("reinos-acero-v1"));
  await page.screenshot({ path: "/tmp/reinos-combate.png", fullPage: true });
  let restored = false,
    turns = 0;
  for (let i = 0; i < 450; i++) {
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("reinos-acero-v1")),
    );
    if (state.result !== "playing") break;
    const u = state.units.find((v) => v.id === state.order[state.turn]);
    if (u.team === "enemy") {
      await page.waitForTimeout(70);
      continue;
    }
    turns++;
    if (!restored) {
      await page.getByRole("button", { name: "Consultar ficha" }).click();
      await page.getByRole("button", { name: "Cerrar ×" }).click();
      await page.reload();
      await page.getByRole("button", { name: "Continuar expedición" }).click();
      restored = true;
    }
    // Read-only planner. All game state changes below go through visible UI controls.
    const plan = await page.evaluate(async () => {
      const E = await import("/src/engine.ts");
      const C = await import("/src/content.ts");
      const g = JSON.parse(localStorage.getItem("reinos-acero-v1")),
        u = E.active(g);
      const enemies = () =>
        g.units.filter((v) => v.team === "enemy" && v.hp > 0);
      const paths = E.reachable(g, u);
      let best = { x: u.x, y: u.y },
        score = -Infinity;
      for (const path of paths.values()) {
        const p = path.at(-1) ?? u;
        const near = Math.min(...enemies().map((t) => E.distance(p, t)));
        const valid = enemies().filter(
          (t) =>
            E.distance(p, t) <= C.classes[u.cls].range && E.lineOfSight(p, t),
        ).length;
        const s =
          valid * 100 - near - path.length * 0.1 - (E.tile(p) === "!" ? 20 : 0);
        if (s > score) {
          best = p;
          score = s;
        }
      }
      const potion = u.hp < u.maxHp - 8 && u.potion > 0;
      // Simulate the candidate position solely to choose an action and target.
      u.x = best.x;
      u.y = best.y;
      let id = "attack",
        target;
      if (u.cls === "Clérigo") {
        target = g.units.find(
          (v) =>
            v.team === "party" &&
            v.hp > 0 &&
            v.hp < v.maxHp - 5 &&
            !E.canUse(g, "bless", v),
        );
        if (target) id = "bless";
      }
      if (!target) {
        const skill = C.classes[u.cls].skill;
        target = enemies()
          .sort((a, b) => a.hp - b.hp)
          .find((t) => !E.canUse(g, skill, t));
        if (target) id = skill;
      }
      if (!target)
        target = enemies()
          .sort((a, b) => a.hp - b.hp)
          .find((t) => !E.canUse(g, "attack", t));
      return {
        best,
        potion,
        id,
        name: C.abilities[id].name,
        target: target ? { x: target.x, y: target.y } : null,
        move:
          E.distance(
            best,
            JSON.parse(localStorage.getItem("reinos-acero-v1")).units.find(
              (v) => v.id === u.id,
            ),
          ) > 0,
      };
    });
    if (plan.potion)
      await page
        .locator(".actions button")
        .filter({ hasText: "Poción" })
        .click();
    else {
      if (plan.move)
        await page
          .getByRole("gridcell", {
            name: `${plan.best.x},${plan.best.y}`,
            exact: true,
          })
          .click();
      if (plan.target) {
        await page
          .locator(".actions button")
          .filter({ hasText: plan.name })
          .click();
        await page
          .getByRole("gridcell", {
            name: new RegExp(`^${plan.target.x},${plan.target.y} `),
          })
          .click();
      }
    }
    const result = await page.evaluate(
      () => JSON.parse(localStorage.getItem("reinos-acero-v1")).result,
    );
    if (result === "playing")
      await page.getByRole("button", { name: "Finalizar turno" }).click();
  }
  const result = await page.evaluate(
    () => JSON.parse(localStorage.getItem("reinos-acero-v1")).result,
  );
  assert.equal(result, "victory");
  await page.getByRole("heading", { name: "El paso es vuestro." }).waitFor();
  await page.screenshot({ path: "/tmp/reinos-victoria.png", fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Continuar expedición" }).click();
  await page.getByRole("heading", { name: "El paso es vuestro." }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result,
      playerTurns: turns,
      saveRestored: restored,
      pageErrors: errors,
      screenshots: ["/tmp/reinos-combate.png", "/tmp/reinos-victoria.png"],
    }),
  );
} finally {
  await browser.close();
}
