import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const slugs = ["humano", "elfo", "enano", "mediano", "orco", "draconido"];
const hashes = slugs.map((s) => {
  const data = readFileSync(`public/art/characters/${s}.png`);
  assert.equal(data.subarray(1, 4).toString(), "PNG");
  assert.equal(data.readUInt32BE(16), 1086);
  assert.equal(data.readUInt32BE(20), 1448);
  return createHash("sha256").update(data).digest("hex");
});
assert.equal(new Set(hashes).size, 6);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
    reducedMotion: "reduce",
  }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("button", { name: "Nueva partida" }).click();
  await page
    .locator(".creation .card")
    .first()
    .getByRole("button", { name: "Elegir por retrato" })
    .click();
  assert.equal(await page.locator(".art-gallery>button").count(), 36);
  const audit = await page.evaluate(async () => {
    const A = await import("/src/character-art.ts"),
      C = await import("/src/content.ts");
    const images = new Map();
    for (const race of Object.keys(C.races)) {
      const art = A.characterArt(race, "Guerrero"),
        im = new Image();
      im.src = art.src;
      await im.decode();
      images.set(race, im);
    }
    const results = [];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext("2d");
    const hash = (race, b) => {
      ctx.clearRect(0, 0, 96, 96);
      ctx.drawImage(
        images.get(race),
        b.x,
        b.y,
        b.width,
        b.height,
        0,
        0,
        96,
        96,
      );
      const data = ctx.getImageData(0, 0, 96, 96).data;
      let h = 2166136261,
        opaque = 0;
      for (let i = 0; i < data.length; i++) {
        const alpha = data[i - (i % 4) + 3];
        h = Math.imul(h ^ (alpha > 64 ? data[i] : 0), 16777619) >>> 0;
        if (i % 4 === 3 && data[i] > 64) opaque++;
      }
      return { hash: h, coverage: opaque / (96 * 96) };
    };
    for (const race of Object.keys(C.races))
      for (const cls of Object.keys(C.classes)) {
        const a = A.characterArt(race, cls);
        results.push({
          race,
          cls,
          key: a.key,
          src: a.src,
          portrait: hash(race, a.portrait),
          body: hash(race, a.body),
        });
      }
    return results;
  });
  assert.equal(new Set(audit.map((a) => a.portrait.hash)).size, 36);
  assert.equal(new Set(audit.map((a) => a.body.hash)).size, 36);
  for (const a of audit) {
    assert.ok(a.portrait.coverage > 0.15, `${a.key} blank portrait`);
    assert.ok(a.body.coverage > 0.08, `${a.key} blank body`);
  }
  await page.screenshot({ path: "/tmp/reinos-galeria-36.png", fullPage: true });
  for (const a of audit) {
    if (!(await page.locator(".art-gallery").count()))
      await page
        .locator(".creation .card")
        .first()
        .getByRole("button", { name: "Elegir por retrato" })
        .click();
    await page
      .getByRole("button", { name: `Elegir ${a.race} ${a.cls}`, exact: true })
      .click();
    const card = page.locator(".creation .card").first();
    assert.equal(
      await card.getByLabel("Raza", { exact: true }).inputValue(),
      a.race,
    );
    assert.equal(
      await card.getByLabel("Clase", { exact: true }).inputValue(),
      a.cls,
    );
    assert.equal(
      await card.locator(".portrait").getAttribute("data-art-key"),
      a.key,
    );
    assert.equal(
      await card.locator(".portrait image").getAttribute("href"),
      a.src,
    );
  }
  const choices = [
    ["Humano", "Mago"],
    ["Enano", "Mago"],
    ["Elfo", "Bárbaro"],
    ["Orco", "Bárbaro"],
  ];
  for (let i = 0; i < 4; i++) {
    const card = page.locator(".creation .card").nth(i);
    await card.getByLabel("Raza", { exact: true }).selectOption(choices[i][0]);
    await card.getByLabel("Clase", { exact: true }).selectOption(choices[i][1]);
  }
  const keys = await page
    .locator(".creation .portrait")
    .evaluateAll((es) => es.map((e) => e.getAttribute("data-art-key")));
  assert.equal(new Set(keys).size, 4);
  await page.screenshot({
    path: "/tmp/reinos-retratos-raza-clase.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Entrar en el Paso Ceniza" }).click();
  await page.getByRole("button", { name: "Pausar relato" }).click();
  const model = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("reinos-acero-v1")),
  );
  for (const u of model.units) {
    const expected = audit.find((a) => a.race === u.race && a.cls === u.cls);
    assert.equal(
      await page
        .locator(`[data-unit-id="${u.id}"] .miniature`)
        .getAttribute("data-art-key"),
      expected.key,
    );
    assert.equal(
      await page
        .locator(`[data-unit-id="${u.id}"] .painted-sprite-image`)
        .getAttribute("href"),
      expected.src,
    );
  }
  for (let i = 0; i < model.order.length; i++) {
    const u = model.units.find((u) => u.id === model.order[i]),
      expected = audit.find((a) => a.race === u.race && a.cls === u.cls);
    assert.equal(
      await page
        .locator(".initiative button")
        .nth(i)
        .locator(".portrait")
        .getAttribute("data-art-key"),
      expected.key,
    );
  }
  await page.locator(".initiative button").first().click();
  const viewed = model.units.find((u) => u.id === model.order[0]),
    expected = audit.find(
      (a) => a.race === viewed.race && a.cls === viewed.cls,
    );
  assert.equal(
    await page.locator(".sheet>.portrait").getAttribute("data-art-key"),
    expected.key,
  );
  await page.getByRole("button", { name: "Cerrar ×" }).click();
  await page.screenshot({
    path: "/tmp/reinos-figuras-pintadas.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      distinctPortraits: 36,
      distinctFullBodies: 36,
      sixUniqueSourceSheets: true,
      all36ChoicesVerified: true,
      explicitExamplesDistinct: true,
      initiativeSheetAndBattleMatch: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
