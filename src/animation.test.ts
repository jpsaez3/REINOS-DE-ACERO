import { describe, it, expect } from "vitest";
import {
  arcPoint,
  effectFor,
  impactPoint,
  playbackDuration,
  samplePath,
} from "./animation";
import { createUnit, newGame, reachable, save, tile, use } from "./engine";
import { defaultStats, type Class } from "./content";
import type { CombatEvent } from "./combat-events";
const event = (id: string, kind: CombatEvent["kind"] = "ability") =>
  ({
    id: 1,
    round: 1,
    kind,
    actorId: "p0",
    actorName: "A",
    team: "party",
    name: id,
    abilityId: id,
    from: { x: 2, y: 2 },
    to: { x: 2, y: 2 },
    path: [],
    details: [],
    effects: [],
    costs: { action: 1, bonus: 0, resources: 1, movement: 0 },
  }) as CombatEvent;
describe("Animación independiente de las reglas", () => {
  it("lluvia, orbe, escarcha y ataques básicos tienen efectos propios", () => {
    expect(effectFor(event("volley"), "Explorador")).toBe("volley");
    expect(effectFor(event("nova"), "Mago")).toBe("fireball");
    expect(effectFor(event("frost"), "Mago")).toBe("frost");
    expect(effectFor(event("attack"), "Explorador")).toBe("arrow");
    expect(effectFor(event("attack"), "Guerrero")).toBe("melee");
    expect(effectFor(event("attack"), "Mago")).toBe("firebolt");
  });
  it("protección, furia, curación, poción y golpes especiales son distinguibles", () => {
    for (const [id, effect, cls] of [
      ["guard", "shield", "Guerrero"],
      ["rage", "rage", "Bárbaro"],
      ["bless", "heal", "Clérigo"],
      ["potion", "potion", "Pícaro"],
      ["expose", "mark", "Pícaro"],
      ["bash", "bash", "Guerrero"],
      ["cleave", "cleave", "Bárbaro"],
      ["breath", "breath", "Mago"],
    ] as const)
      expect(effectFor(event(id), cls)).toBe(effect);
  });
  it("camina por cada tramo ortogonal del camino, sin cortar esquinas", () => {
    const from = { x: 2, y: 2 },
      path = [
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
      ];
    expect(samplePath(from, path, 0)).toMatchObject(from);
    expect(samplePath(from, path, 0.375)).toMatchObject({ x: 2, y: 3.5 });
    expect(samplePath(from, path, 0.625)).toMatchObject({ x: 2.5, y: 4 });
    expect(samplePath(from, path, 1)).toMatchObject({ x: 4, y: 4 });
    expect(samplePath(from, path, 0.5).dy).toBe(0);
  });
  it("interpolar una ruta real no atraviesa obstáculos y termina en su destino", () => {
    const units = ["Guerrero", "Pícaro", "Mago", "Clérigo"].map((c, i) =>
      createUnit(
        "p" + i,
        "A",
        "Humano",
        c as Class,
        defaultStats(c as Class),
        2,
        i + 2,
      ),
    );
    const g = newGame(units, 3),
      u = g.units[0];
    u.move = 10;
    const path = reachable(g, u).get("4,2")!;
    for (let i = 0; i <= 100; i++) {
      const p = samplePath(u, path, i / 100);
      expect(
        tile({ x: Math.floor(p.x + 0.5), y: Math.floor(p.y + 0.5) }),
      ).not.toMatch(/[#c]/);
    }
    expect(samplePath(u, path, 1)).toMatchObject(path.at(-1)!);
  });
  it("la trayectoria de las flechas sube y vuelve al objetivo exacto", () => {
    const a = { x: 1, y: 2 },
      b = { x: 5, y: 2 };
    expect(arcPoint(a, b, 0, 2)).toEqual(a);
    expect(arcPoint(a, b, 0.5, 2).y).toBeLessThan(a.y);
    expect(arcPoint(a, b, 1, 2).x).toBe(b.x);
    expect(arcPoint(a, b, 1, 2).y).toBeCloseTo(b.y);
  });
  it("el movimiento largo dura más, el modo rápido conserva un intervalo visible", () => {
    const short = event("walk", "move"),
      long = {
        ...short,
        path: Array.from({ length: 8 }, (_, i) => ({ x: i, y: 2 })),
      };
    expect(playbackDuration(long, false)).toBeGreaterThan(
      playbackDuration(short, false),
    );
    expect(playbackDuration(long, true)).toBeLessThan(
      playbackDuration(long, false),
    );
    expect(playbackDuration(long, true)).toBeGreaterThan(200);
    for (const kind of ["walk", "fireball", "volley", "melee"] as const) {
      expect(impactPoint(kind)).toBeGreaterThan(0);
      expect(impactPoint(kind)).toBeLessThan(1);
    }
  });
  it("muestrear la animación no consume tiradas ni cambia el guardado", () => {
    const p = Array.from({ length: 4 }, (_, i) =>
      createUnit(
        "p" + i,
        "M",
        "Humano",
        "Mago",
        defaultStats("Mago"),
        2,
        i + 2,
      ),
    );
    const g = newGame(p, 9),
      raw = save(g),
      e = event("nova");
    for (let i = 0; i < 100; i++) {
      samplePath(e.from, e.path, i / 100);
      arcPoint(e.from, { x: 4, y: 2 }, i / 100, 2);
      effectFor(e, "Mago");
    }
    expect(save(g)).toBe(raw);
  });
  it("los eventos guardan raza, clase y posiciones del objetivo para la presentación", () => {
    const p = Array.from({ length: 4 }, (_, i) =>
        createUnit(
          "p" + i,
          "M",
          "Enano",
          "Mago",
          defaultStats("Mago"),
          2,
          i + 2,
        ),
      ),
      g = newGame(p, 9);
    g.turn = g.order.indexOf("p0");
    const target = g.units.find((u) => u.id === "e1")!;
    target.x = 4;
    target.y = 2;
    expect(use(g, "nova", target.id)).toBe(true);
    const e = g.events!.at(-1)!;
    expect(e.actorClass).toBe("Mago");
    expect(e.actorRace).toBe("Enano");
    expect(e.targetPosition).toEqual({ x: 4, y: 2 });
    expect(e.effects.find((v) => v.id === target.id)?.position).toEqual({
      x: 4,
      y: 2,
    });
    target.x = 6;
    expect(e.targetPosition?.x).toBe(4);
  });
});
