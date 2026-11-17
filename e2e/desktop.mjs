import { _electron as electron } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const packaged = process.argv.includes("--packaged");
const executablePath =
  process.env.REINOS_PACKAGED_EXECUTABLE ||
  (packaged
    ? path.resolve(
        "release",
        process.platform === "win32"
          ? "win-unpacked/Reinos de Acero.exe"
          : "linux-unpacked/reinos-de-acero",
      )
    : require("electron"));
const profile = await fs.mkdtemp(
  path.join(os.tmpdir(), "reinos-desktop-test-"),
);
let app;
const errors = [];
const start = async () => {
  const args = packaged ? [] : [path.resolve(".")];
  args.push(`--profile-dir=${profile}`);
  if (
    process.platform === "linux" &&
    process.env.REINOS_TEST_NO_SANDBOX === "1"
  )
    args.push("--no-sandbox");
  const instance = await electron.launch({
    executablePath,
    args,
    timeout: 60000,
  });
  const page = await instance.firstWindow();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.waitForURL("reinos://app/index.html");
  await page.getByRole("button", { name: "Nueva partida" }).waitFor();
  return { instance, page };
};
try {
  let current = await start();
  app = current.instance;
  let page = current.page;
  const preferences = await app.evaluate(({ BrowserWindow, app }) => ({
    packaged: app.isPackaged,
    ...BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
  }));
  assert.equal(preferences.nodeIntegration, false);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.sandbox, true);
  if (packaged) assert.equal(preferences.packaged, true);
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  const art = await page.evaluate(async () => {
    const files = ["humano", "elfo", "enano", "mediano", "orco", "draconido"];
    for (const file of files) {
      const image = new Image();
      image.src = `/art/characters/${file}.png`;
      await image.decode();
      if (image.naturalWidth !== 1086) return false;
    }
    const image = new Image();
    image.src = "/art/courtyard.png";
    await image.decode();
    return image.naturalWidth > 1000;
  });
  assert.equal(art, true);
  const blocked = await page.evaluate(async () => {
    try {
      await fetch("https://example.com/");
      return false;
    } catch {
      return true;
    }
  });
  assert.equal(blocked, true);
  await fs.mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/desktop-menu.png" });
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  assert.equal(await page.locator(".creation .card").count(), 4);
  await page.getByRole("button", { name: "Entrar en el Paso Ceniza" }).click();
  await page.getByRole("button", { name: "Pausar relato" }).click();
  const raw = await page.evaluate(() =>
    localStorage.getItem("reinos-acero-v1"),
  );
  const saved = JSON.parse(raw);
  assert.equal(saved.version, 1);
  assert.equal(saved.units.length, 7);
  await page.screenshot({
    path: "test-results/desktop-combat.png",
    fullPage: true,
  });
  await app.close();
  app = undefined;
  current = await start();
  app = current.instance;
  page = current.page;
  assert.equal(
    await page.evaluate(() => localStorage.getItem("reinos-acero-v1")),
    raw,
  );
  await page.getByRole("button", { name: "Continuar expedición" }).click();
  await page.getByRole("grid", { name: "Tablero táctico" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      platform: process.platform,
      packaged,
      startsWithoutServer: true,
      allArtIncluded: true,
      externalNetworkBlocked: true,
      isolatedRenderer: true,
      createsPartyAndBattle: true,
      saveSurvivesAppRestart: true,
      pageErrors: errors,
    }),
  );
} finally {
  if (app) await app.close();
  await fs.rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
}
