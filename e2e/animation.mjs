import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
    reducedMotion: "no-preference",
  }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const scene = () => page.locator(".combat-scene");
async function fixture(cls, race = "Humano", wounded = false) {
  await page.evaluate(
    async ({ cls, race, wounded }) => {
      const E = await import("/src/engine.ts"),
        C = await import("/src/content.ts");
      const party = [cls, "Pícaro", "Mago", "Clérigo"].map((c, i) =>
        E.createUnit(
          "p" + i,
          ["Aldara", "Nim", "Borin", "Sarya"][i],
          i === 0 ? race : "Humano",
          c,
          C.defaultStats(c),
          [2, 1, 2, 3][i],
          [2, 4, 5, 5][i],
        ),
      );
      const g = E.newGame(party, 2026),
        e1 = g.units.find((u) => u.id === "e1"),
        e2 = g.units.find((u) => u.id === "e2");
      e1.x = 4;
      e1.y = 2;
      e2.x = 4;
      e2.y = 1;
      while (E.active(g).id !== "p0") E.endTurn(g);
      if (wounded) E.active(g).hp -= 7;
      localStorage.setItem("reinos-acero-v1", E.save(g));
      localStorage.setItem("reinos-fast", "false");
    },
    { cls, race, wounded },
  );
  await page.reload();
  await page.getByRole("button", { name: "Continuar expedición" }).click();
  await page.getByRole("button", { name: "Finalizar turno" }).waitFor();
}
async function pauseAt(min, max = 1) {
  await page.waitForFunction(
    ({ min, max }) => {
      const s = document.querySelector(".combat-scene"),
        p = Number(s?.getAttribute("data-progress"));
      return p > min && p < max && s?.getAttribute("data-event-id");
    },
    { min, max },
  );
  await page.getByRole("button", { name: "Pausar relato" }).click();
}
async function resume() {
  await page.getByRole("button", { name: "Reanudar relato" }).click();
}
async function cast(name) {
  await page.locator(".actions button").filter({ hasText: name }).click();
  await page.getByRole("gridcell", { name: /^4,2 / }).click();
}
try {
  await page.goto("http://127.0.0.1:5173");
  // These isolated encounters are built by the real engine; actions still go through the visible UI.
  await fixture("Guerrero");
  const seed = await page.evaluate(
    () => JSON.parse(localStorage.getItem("reinos-acero-v1")).seed,
  );
  await page.getByRole("gridcell", { name: "4,4", exact: true }).click();
  await pauseAt(0.22, 0.7);
  const walker = page.locator('.scene-unit[data-unit-id="p0"]'),
    pose = () =>
      walker.evaluate((el) => ({
        x: el.getAttribute("data-x"),
        y: el.getAttribute("data-y"),
        stride: el.querySelector(".miniature").getAttribute("data-stride"),
        legs: [...el.querySelectorAll(".mini-leg")].map((v) =>
          v.getAttribute("transform"),
        ),
      }));
  const atPause = await pose();
  assert.notDeepEqual([Number(atPause.x), Number(atPause.y)], [4, 4]);
  assert.notEqual(atPause.legs[0], atPause.legs[1]);
  assert.equal(
    await walker.locator(".miniature").getAttribute("data-walking"),
    "true",
  );
  const frozen = await scene().getAttribute("data-progress");
  await page.waitForTimeout(350);
  assert.deepEqual(await pose(), atPause);
  assert.equal(await scene().getAttribute("data-progress"), frozen);
  await page
    .getByRole("button", { name: "Ritmo: detallado", exact: true })
    .click();
  await page.waitForTimeout(100);
  assert.equal(await scene().getAttribute("data-progress"), frozen);
  await page
    .getByRole("button", { name: "Ritmo: rápido", exact: true })
    .click();
  await page.screenshot({ path: "/tmp/reinos-caminando.png", fullPage: true });
  await resume();
  await page.waitForTimeout(220);
  assert.notDeepEqual(await pose(), atPause);
  await page.getByRole("button", { name: "Finalizar turno" }).waitFor();
  assert.equal(await walker.getAttribute("data-x"), "4.000");
  assert.equal(await walker.getAttribute("data-y"), "4.000");
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("reinos-acero-v1")).seed,
    ),
    seed,
  );
  await fixture("Explorador");
  await cast("Lluvia de flechas");
  await page.waitForFunction(
    () => document.querySelectorAll(".flying-arrow").length >= 3,
  );
  await pauseAt(0.3, 0.6);
  assert.equal(
    await page.locator(".action-effect").getAttribute("data-effect"),
    "volley",
  );
  assert.ok((await page.locator(".flying-arrow").count()) >= 3);
  const targetBefore = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("reinos-acero-v1"))
        .events.at(-1)
        .effects.find((e) => e.id === "e1").hpBefore,
  );
  assert.equal(
    Number(await page.locator('[data-unit-id="e1"]').getAttribute("data-hp")),
    targetBefore,
  );
  assert.equal(await page.locator(".combat-float").count(), 0);
  await page.screenshot({
    path: "/tmp/reinos-lluvia-flechas.png",
    fullPage: true,
  });
  await resume();
  await page.waitForFunction(
    () =>
      document.querySelector(".combat-scene")?.getAttribute("data-impact") ===
      "true",
  );
  await page.getByRole("button", { name: "Pausar relato" }).click();
  assert.ok(await page.locator(".impact-burst.physical").count());
  assert.ok(await page.locator(".combat-float").count());
  await fixture("Mago");
  await cast("Orbe de fuego");
  await pauseAt(0.32, 0.52);
  assert.ok(await page.locator(".spell-projectile").count());
  assert.equal(
    await page.locator(".action-effect").getAttribute("data-effect"),
    "fireball",
  );
  await page.screenshot({ path: "/tmp/reinos-orbe-vuelo.png", fullPage: true });
  await resume();
  await page.waitForFunction(
    () =>
      document.querySelector(".combat-scene")?.getAttribute("data-impact") ===
      "true",
  );
  await page.getByRole("button", { name: "Pausar relato" }).click();
  assert.ok(await page.locator(".impact-burst.fire").count());
  await page.screenshot({
    path: "/tmp/reinos-orbe-impacto.png",
    fullPage: true,
  });
  await fixture("Mago");
  await cast("Estallido de escarcha");
  await page.locator(".impact-burst.ice").first().waitFor();
  await fixture("Clérigo", "Humano", true);
  await page
    .locator(".actions button")
    .filter({ hasText: "Bendición sanadora" })
    .click();
  await page.getByRole("gridcell", { name: /^2,2 / }).click();
  await page.locator(".healing-rings").waitFor();
  await page.locator(".combat-float.healing").first().waitFor();
  await fixture("Guerrero");
  await page.getByRole("gridcell", { name: "3,2", exact: true }).click();
  await page
    .locator(".actions button")
    .filter({ hasText: "Ataque básico" })
    .click();
  await page.getByRole("gridcell", { name: /^4,2 / }).click();
  await page.locator(".weapon-slash").waitFor();
  assert.ok(
    Number(
      await page
        .locator('[data-unit-id="p0"] .weapon-arm')
        .getAttribute("data-gesture"),
    ) > 0,
  );
  await fixture("Guerrero");
  await page
    .locator(".actions button")
    .filter({ hasText: "Postura protectora" })
    .click();
  await page.locator(".shield-aura").waitFor();
  await fixture("Bárbaro");
  await page.locator(".actions button").filter({ hasText: "Furia" }).click();
  await page.locator(".action-effect.rage .impact-burst.fire").waitFor();
  await fixture("Pícaro", "Humano", true);
  await page.locator(".actions button").filter({ hasText: "Poción" }).click();
  await page.locator(".held-potion").waitFor();
  await page.locator(".potion-bubbles").waitFor();
  await fixture("Pícaro");
  await cast("Revelar debilidad");
  await page.locator(".weakness-sigil").waitFor();
  await fixture("Mago", "Dracónido");
  await cast("Aliento ígneo");
  await page.locator(".dragon-flame").waitFor();
  // Accessibility mode keeps the explanatory effect, but removes moving limbs/projectiles.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixture("Explorador");
  await cast("Lluvia de flechas");
  await page.waitForFunction(
    () =>
      document.querySelector(".combat-scene")?.getAttribute("data-impact") ===
      "true",
  );
  assert.equal(await page.locator(".flying-arrow").count(), 0);
  assert.equal(
    await page.locator('.miniature[data-walking="true"]').count(),
    0,
  );
  assert.ok(await page.locator(".impact-burst.physical").count());
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      walkingAlongPath: true,
      articulatedLegs: true,
      pauseFreezesPose: true,
      resumeContinuesPose: true,
      speedChangePreservesProgress: true,
      volleyHasMultipleArrows: true,
      damageAtImpact: true,
      fireOrbAndExplosion: true,
      iceAndHealing: true,
      meleeShieldRagePotionMarkBreath: true,
      reducedMotion: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
