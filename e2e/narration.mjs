import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1500, height: 1100 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.addInitScript(() => {
    Date.now = () => 2026;
  });
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("button", { name: "Nueva partida" }).click();
  await page.getByRole("button", { name: "Entrar en el Paso Ceniza" }).click();
  const art = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/art/courtyard.png";
    await image.decode();
    const board = document.querySelector(".scene-board"),
      cell = document.querySelector(".scene-board>.tile");
    return {
      loaded: image.naturalWidth > 1000,
      background: getComputedStyle(board).backgroundImage,
      cellBackground: getComputedStyle(cell).backgroundImage,
      cellBorder: getComputedStyle(cell).borderTopWidth,
    };
  });
  assert.equal(art.loaded, true);
  assert.match(art.background, /courtyard/);
  assert.equal(art.cellBackground, "none");
  assert.equal(art.cellBorder, "0px");
  await page.getByLabel("Ayudas tácticas").check();
  assert.ok(await page.locator(".scene-board.tactical-guides").count());
  await page.getByLabel("Ayudas tácticas").uncheck();
  await page.screenshot({
    path: "/tmp/reinos-escenario-continuo.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Finalizar turno" }).click();
  await page.waitForFunction(() => {
    const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
    return (
      g?.events?.at(-1)?.kind === "move" &&
      g.units.find((u) => u.id === g.order[g.turn]).team === "enemy"
    );
  });
  await page.getByRole("button", { name: "Pausar relato" }).click();
  const movement = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reinos-acero-v1")),
  );
  assert.equal(movement.aiStage, "act");
  assert.match(
    await page.locator(".sidebar>.action-story").innerText(),
    /se desplaza/,
  );
  assert.ok(await page.locator(".movement-trace").count());
  await page.waitForTimeout(1800);
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("reinos-acero-v1")),
    ),
    movement,
  );
  await page.screenshot({
    path: "/tmp/reinos-relato-movimiento.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reanudar relato" }).click();
  await page
    .locator(".enemy-announcement")
    .filter({ hasText: "EL RIVAL PREPARA SU ACCIÓN" })
    .waitFor();
  const plan = await page.evaluate(async () => {
    const E = await import("/src/engine.ts");
    const C = await import("/src/content.ts");
    const g = JSON.parse(localStorage.getItem("reinos-acero-v1")),
      p = E.aiAction(g);
    return {
      actor: E.active(g).name,
      target: g.units.find((u) => u.id === p.targetId).name,
      ability: C.abilities[p.abilityId].name,
    };
  });
  const announcement = await page.locator(".enemy-announcement").innerText();
  assert.ok(announcement.includes(plan.actor));
  assert.ok(announcement.includes(plan.target));
  assert.ok(announcement.includes(plan.ability));
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("reinos-acero-v1")).aiStage === "end",
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".combat-scene")?.getAttribute("data-impact") ===
      "true",
  );
  await page.getByRole("button", { name: "Pausar relato" }).click();
  const story = page.locator(".sidebar>.action-story");
  assert.ok((await story.innerText()).includes(plan.actor));
  assert.ok((await story.innerText()).includes(plan.ability));
  await story
    .getByText("Ver tiradas y resolución completa", { exact: true })
    .click();
  assert.match(await story.innerText(), /Coste:/);
  assert.ok((await story.innerText()).includes(plan.target));
  await page.screenshot({
    path: "/tmp/reinos-relato-accion.png",
    fullPage: true,
  });
  const staged = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reinos-acero-v1")),
  );
  const lastId = staged.events.at(-1).id,
    actorId = staged.order[staged.turn];
  // Reload a saved turn after its action: it must finish, never attack a second time.
  await page.reload();
  await page.getByRole("button", { name: "Continuar expedición" }).click();
  await page.waitForFunction((id) => {
    const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
    return g.order[g.turn] !== id;
  }, actorId);
  const restored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reinos-acero-v1")),
  );
  assert.equal(
    restored.events.filter((e) => e.id > lastId && e.actorId === actorId)
      .length,
    0,
  );
  await page.waitForFunction((id) => {
    const g = JSON.parse(localStorage.getItem("reinos-acero-v1"));
    const e = g.events?.at(-1);
    return (
      e?.id > id &&
      e.team === "enemy" &&
      ["attack", "pin", "frost"].includes(e.abilityId)
    );
  }, lastId);
  await page.waitForFunction(
    () =>
      document.querySelector(".combat-scene")?.getAttribute("data-impact") ===
      "true",
  );
  await page.getByRole("button", { name: "Pausar relato" }).click();
  const attack = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reinos-acero-v1")).events.at(-1),
  );
  assert.ok(
    (await page.locator(".sidebar>.action-story").innerText()).includes(
      attack.actorName,
    ),
  );
  assert.ok(
    (await page.locator(".sidebar>.action-story").innerText()).includes(
      attack.targetName,
    ),
  );
  assert.ok(await page.locator(".action-effect").count());
  await page
    .locator(".sidebar>.action-story")
    .getByText("Ver tiradas y resolución completa", { exact: true })
    .click();
  assert.match(
    await page.locator(".sidebar>.action-story").innerText(),
    /d20|recibe/,
  );
  await page.screenshot({
    path: "/tmp/reinos-ataque-rival.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      continuousScene: true,
      gridHidden: true,
      tacticalToggle: true,
      enemyMovementSeparated: true,
      exactActionAnnounced: plan,
      pauseVerified: true,
      detailedResolution: true,
      midTurnRestoreNoRepeat: true,
      enemyAttackAndTargetShown: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
