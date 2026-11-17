import { load, newGame, createUnit, save } from "./engine";
import { defaultStats } from "./content";
import { describe, it, expect } from "vitest";
import { characterArt, portraitFrame, ART_CLASSES } from "./character-art";
import { races, classes, type Race, type Class } from "./content";
const all = () =>
  Object.keys(races).flatMap((r) =>
    Object.keys(classes).map((c) => characterArt(r as Race, c as Class)),
  );
describe("Arte propio por combinación de raza y clase", () => {
  it("cubre exactamente las 36 combinaciones sin compartir región de retrato", () => {
    const entries = all();
    expect(entries).toHaveLength(36);
    expect(new Set(entries.map((a) => a.key)).size).toBe(36);
    expect(
      new Set(entries.map((a) => a.src + JSON.stringify(a.portrait))).size,
    ).toBe(36);
  });
  it("cada combinación tiene también una figura pintada diferente", () => {
    expect(new Set(all().map((a) => a.src + JSON.stringify(a.body))).size).toBe(
      36,
    );
  });
  it("humano/enano mago y elfo/orco bárbaro no utilizan el mismo arte", () => {
    expect(characterArt("Humano", "Mago").src).not.toBe(
      characterArt("Enano", "Mago").src,
    );
    expect(characterArt("Elfo", "Bárbaro").src).not.toBe(
      characterArt("Orco", "Bárbaro").src,
    );
  });
  it("todas las regiones quedan dentro del atlas y no invaden otra fila", () => {
    for (const a of all()) {
      for (const b of [
        a.portrait,
        a.body,
        portraitFrame(a.race, a.cls, false),
      ]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.width).toBeGreaterThan(0);
        expect(b.height).toBeGreaterThan(0);
        expect(b.x + b.width).toBeLessThanOrEqual(a.sheetWidth);
        expect(b.y + b.height).toBeLessThanOrEqual(a.sheetHeight);
      }
      expect(a.portrait.y + a.portrait.height).toBeLessThanOrEqual(a.body.y);
    }
  });
  it("el orden de clases es explícito y las razas conservan todas las clases", () => {
    expect(ART_CLASSES).toEqual(Object.keys(classes));
    for (const race of Object.keys(races) as Race[])
      for (const cls of ART_CLASSES)
        expect(characterArt(race, cls)).toMatchObject({ race, cls });
  });
  it("una combinación desconocida no cae silenciosamente en un retrato genérico", () => {
    expect(() => characterArt("Gigante" as Race, "Mago")).toThrow();
    expect(() => characterArt("Humano", "Monje" as Class)).toThrow();
  });
});

it("un guardado con raza desconocida se rechaza antes de dibujar el catálogo", () => {
  const party = Array.from({ length: 4 }, (_, i) =>
    createUnit("p" + i, "P", "Humano", "Mago", defaultStats("Mago"), 2, i + 2),
  );
  const g = newGame(party, 1);
  g.units[0].race = "Desconocida" as Race;
  expect(() => load(save(g))).toThrow("Personaje inválido");
});
