import { describe, it, expect } from "vitest";
import {
  classes,
  defaultStats,
  pointCost,
  races,
  type Class,
  type Race,
} from "./content";
import {
  active,
  aiTurn,
  board,
  canUse,
  createUnit,
  defense,
  distance,
  endTurn,
  has,
  lineOfSight,
  load,
  mod,
  move,
  newGame,
  outcome,
  reachable,
  roll,
  save,
  use,
  type Game,
  type Unit,
} from "./engine";
const party = () =>
  ["Guerrero", "Pícaro", "Mago", "Clérigo"].map((c, i) =>
    createUnit(
      "p" + i,
      "Héroe " + i,
      (["Elfo", "Mediano", "Enano", "Humano"] as Race[])[i],
      c as Class,
      defaultStats(c as Class),
      2,
      i + 2,
    ),
  );
function fixture(cls: Class = "Guerrero", race: Race = "Elfo") {
  const p = party();
  p[0] = createUnit("p0", "Prueba", race, cls, defaultStats(cls), 2, 2);
  const g = newGame(p, 123);
  g.turn = g.order.indexOf("p0");
  const u = active(g);
  u.move = 8;
  u.action = 1;
  u.resource = 10;
  const t = g.units.find((v) => v.id === "e1")!;
  t.x = 3;
  t.y = 2;
  t.hp = t.maxHp = 100;
  return { g, u, t };
}
function seedFor(value: number) {
  for (let s = 0; s < 100000; s++) {
    const g = { seed: s } as Game;
    if (roll(g, 20) === value) return s;
  }
  throw Error("seed");
}
describe("Creación y tiradas", () => {
  it("calcula modificadores y coste creciente", () => {
    expect([mod(8), mod(10), mod(15)]).toEqual([-1, 0, 2]);
    expect(
      pointCost({
        Fuerza: 15,
        Destreza: 15,
        Constitución: 15,
        Inteligencia: 8,
        Sabiduría: 8,
        Carisma: 8,
      }),
    ).toBe(27);
  });
  it("admite las 36 combinaciones, incluidas clases repetidas", () => {
    for (const r of Object.keys(races) as Race[])
      for (const c of Object.keys(classes) as Class[]) {
        const u = createUnit("x", "X", r, c, defaultStats(c), 2, 2);
        expect(u.maxHp).toBeGreaterThan(0);
        expect(u.cls).toBe(c);
      }
    const g = newGame(
      Array.from({ length: 4 }, (_, i) =>
        createUnit(
          "p" + i,
          "Mago",
          "Enano",
          "Mago",
          defaultStats("Mago"),
          2,
          i + 2,
        ),
      ),
      1,
    );
    expect(g.units.filter((u) => u.team === "party")).toHaveLength(4);
  });
  it("rechaza distribución inválida", () => {
    expect(() =>
      createUnit(
        "p",
        "P",
        "Humano",
        "Mago",
        { ...defaultStats("Mago"), Fuerza: 20 },
        2,
        2,
      ),
    ).toThrow();
  });
  it("iniciativa reproducible y desempate por destreza e id", () => {
    const a = newGame(party(), 42),
      b = newGame(party(), 42);
    expect(a.order).toEqual(b.order);
    const sorted = a.units
      .slice()
      .sort(
        (a, b) =>
          b.initiative - a.initiative ||
          b.stats.Destreza - a.stats.Destreza ||
          a.id.localeCompare(b.id),
      );
    expect(a.order).toEqual(sorted.map((u) => u.id));
    expect(a.log[0]).toMatch(/iniciativa/);
  });
  it("d20 siempre dentro de rango", () => {
    const g = newGame(party(), 1);
    for (let i = 0; i < 500; i++) {
      const r = roll(g, 20);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
  });
});
describe("Geometría y economía", () => {
  it("no dispara a través de paredes ni esquinas", () => {
    expect(lineOfSight({ x: 4, y: 2 }, { x: 6, y: 2 })).toBe(false);
    expect(lineOfSight({ x: 2, y: 2 }, { x: 4, y: 2 })).toBe(true);
    expect(lineOfSight({ x: 4, y: 2 }, { x: 6, y: 4 })).toBe(false);
    const { g, u, t } = fixture("Explorador");
    u.x = 4;
    t.x = 6;
    expect(canUse(g, "attack", t)).toMatch(/visión/);
    expect(use(g, "attack", t.id)).toBe(false);
  });
  it("busca caminos sin cruzar obstáculos u ocupantes y cobra cada paso", () => {
    const { g, u } = fixture();
    const paths = reachable(g, u);
    expect(paths.has("5,2")).toBe(false);
    expect(paths.has("3,2")).toBe(false);
    for (const path of paths.values())
      for (const p of path) {
        expect(board[p.y][p.x]).not.toMatch(/[#c]/);
        expect(
          g.units.some(
            (v) => v.id !== u.id && v.hp > 0 && distance(v, p) === 0,
          ),
        ).toBe(false);
      }
    const dest = paths.get("4,2")!;
    expect(dest.length).toBeGreaterThan(2);
    expect(move(g, { x: 4, y: 2 })).toBe(true);
    expect(u.move).toBe(8 - dest.length);
  });
  it("el alcance y la acción impiden ataques extra", () => {
    const { g, u, t } = fixture();
    t.x = 10;
    expect(use(g, "attack", t.id)).toBe(false);
    t.x = 3;
    expect(use(g, "attack", t.id)).toBe(true);
    expect(u.action).toBe(0);
    expect(use(g, "attack", t.id)).toBe(false);
    expect(use(g, "guard", u.id)).toBe(false);
    expect(u.bonus).toBe(0);
  });
  it("cobra recursos solo en acciones válidas", () => {
    const { g, u } = fixture();
    u.resource = 0;
    expect(use(g, "guard", u.id)).toBe(false);
    expect(u.action).toBe(1);
    u.resource = 1;
    expect(use(g, "guard", u.id)).toBe(true);
    expect(u.resource).toBe(0);
  });
  it("cobertura parcial suma dos a distancia", () => {
    const { g, t } = fixture();
    t.x = 4;
    t.y = 3;
    expect(defense(g, t, { x: 2, y: 3 })).toBe(t.def + 2);
    expect(defense(g, t, { x: 4, y: 2 })).toBe(t.def);
  });
  it("guardia protege aliados, retiene y reacciona durante el turno enemigo", () => {
    const { g, u, t } = fixture();
    const ally = g.units.find((v) => v.id === "p1")!;
    ally.x = 2;
    ally.y = 1;
    t.x = 3;
    t.y = 2;
    expect(use(g, "guard", u.id)).toBe(true);
    expect(defense(g, ally, t)).toBe(ally.def + 2);
    endTurn(g);
    expect(has(u, "guard")).toBe(true);
    t.move = 5;
    expect(reachable(g, t).has("4,2")).toBe(false);
    g.turn = g.order.indexOf(t.id);
    t.action = 1;
    g.seed = seedFor(20);
    const hp = t.hp;
    use(g, "attack", u.id);
    expect(t.hp).toBeLessThan(hp);
    expect(u.reaction).toBe(0);
  });
  it("brasas dañan al pasar y respetan resistencia dracónica", () => {
    const { g, u } = fixture("Guerrero", "Dracónido");
    u.x = 8;
    u.y = 6;
    const hp = u.hp;
    expect(move(g, { x: 8, y: 7 })).toBe(true);
    expect(u.hp).toBe(hp - 1);
  });
});
describe("Ataques y habilidades", () => {
  it("1 falla automáticamente y 20 produce crítico registrado", () => {
    const { g, u, t } = fixture("Guerrero", "Humano");
    g.seed = seedFor(1);
    const hp = t.hp;
    use(g, "attack", t.id);
    expect(t.hp).toBe(hp);
    u.action = 1;
    g.seed = seedFor(20);
    use(g, "attack", t.id);
    expect(t.hp).toBeLessThan(hp - 3);
    expect(g.log.join(" ")).toContain("CRÍTICO");
  });
  it("suerte mediana repite solo el primer uno", () => {
    const { g, u, t } = fixture("Pícaro", "Mediano");
    g.seed = seedFor(1);
    use(g, "attack", t.id);
    expect(u.luck).toBe(false);
    expect(g.log.join(" ")).toContain("Suerte mediana");
  });
  it("enano mago usa escarcha y aplica vulnerabilidad al centinela", () => {
    const { g, u, t } = fixture("Mago", "Enano");
    expect(use(g, "frost", t.id)).toBe(true);
    expect(has(t, "slow")).toBe(true);
    expect(t.hp).toBeLessThan(98);
    expect(u.resource).toBe(9);
  });
  it("sujeción habilita golpe oportunista", () => {
    const { g, u, t } = fixture("Explorador");
    g.seed = seedFor(20);
    use(g, "pin", t.id);
    expect(has(t, "root")).toBe(true);
    expect(reachable(g, t, 5).size).toBe(1);
    const rogue = g.units.find((v) => v.cls === "Pícaro")!;
    rogue.x = 3;
    rogue.y = 1;
    g.turn = g.order.indexOf(rogue.id);
    rogue.action = 1;
    expect(canUse(g, "ambush", t)).toBe(null);
    expect(use(g, "ambush", t.id)).toBe(true);
    void u;
  });
  it("bendición cura y mejora defensa, estados expiran", () => {
    const { g, u } = fixture("Clérigo");
    u.hp -= 10;
    const hp = u.hp;
    expect(use(g, "bless", u.id)).toBe(true);
    expect(u.hp).toBeGreaterThan(hp);
    expect(defense(g, u, { x: 3, y: 2 })).toBe(u.def + 2);
    endTurn(g);
    g.turn = g.order.indexOf(u.id);
    endTurn(g);
    expect(has(u, "bless")).toBe(false);
  });
  it("furia habilita una poción adicional sin regalar acciones", () => {
    const { g, u } = fixture("Bárbaro");
    u.hp -= 10;
    expect(use(g, "rage", u.id)).toBe(true);
    expect(u.bonus).toBe(1);
    expect(use(g, "potion", u.id)).toBe(true);
    expect(u.bonus).toBe(0);
    expect(use(g, "attack", "e1")).toBe(false);
    expect(u.potion).toBe(0);
  });
  it("dracónido consume aliento y orco sobrevive una vez", () => {
    const { g, u, t } = fixture("Mago", "Dracónido");
    t.race = "Orco";
    t.hp = 1;
    expect(use(g, "breath", t.id)).toBe(true);
    expect(t.hp).toBe(1);
    expect(t.tenacity).toBe(false);
    expect(u.breath).toBe(0);
    u.action = 1;
    expect(use(g, "breath", t.id)).toBe(false);
  });
  it("ninguna clase usa habilidades ajenas", () => {
    const { g, u } = fixture("Mago");
    expect(canUse(g, "guard", u)).toBe("Habilidad no aprendida");
  });
});
describe("IA, finales y persistencia", () => {
  it("IA respeta paredes, casillas y economía en turnos sucesivos", () => {
    const g = newGame(party(), 17);
    for (let i = 0; i < 35 && g.result === "playing"; i++) {
      const u = active(g);
      if (u.team === "enemy") aiTurn(g);
      else endTurn(g);
      const occupied = g.units
        .filter((u) => u.hp > 0)
        .map((u) => `${u.x},${u.y}`);
      expect(new Set(occupied).size).toBe(occupied.length);
      for (const v of g.units) expect(board[v.y][v.x]).not.toMatch(/[#c]/);
    }
    expect(g.log.some((s) => s.includes("usa"))).toBe(true);
  });
  it("victoria y progresión se otorgan una sola vez", () => {
    const g = newGame(party(), 1);
    g.units.filter((u) => u.team === "enemy").forEach((u) => (u.hp = 0));
    outcome(g);
    expect(g.result).toBe("victory");
    expect(g.units[0].level).toBe(2);
    outcome(g);
    expect(g.units[0].xp).toBe(100);
  });
  it("IA completa una derrota sin intervención del jugador", () => {
    const g = newGame(party(), 91);
    for (let i = 0; i < 500 && g.result === "playing"; i++) {
      if (active(g).team === "enemy") aiTurn(g);
      else endTurn(g);
    }
    expect(g.result).toBe("defeat");
  });
  it("conserva turnos, recursos, estados y RNG al guardar", () => {
    const { g, u } = fixture();
    use(g, "guard", u.id);
    const copy = load(save(g));
    expect(copy).toEqual(g);
    endTurn(copy);
    endTurn(g);
    expect(copy).toEqual(g);
    expect(roll(copy, 20)).toBe(roll(g, 20));
  });
  it("rechaza guardados dañados e incompatibles", () => {
    expect(() => load("{}")).toThrow();
    const g = newGame(party(), 1);
    g.units[0].x = -1;
    expect(() => load(save(g))).toThrow();
  });
});
it("completa un encuentro con victoria usando movimiento, habilidades y ataques legales", () => {
  const g = newGame(party(), 2026);
  for (let i = 0; i < 500 && g.result === "playing"; i++) {
    const u = active(g);
    if (u.team === "enemy") {
      aiTurn(g);
      continue;
    }
    const enemies = () => g.units.filter((v) => v.team === "enemy" && v.hp > 0);
    if (u.hp < u.maxHp - 8 && u.potion) use(g, "potion", u.id);
    if (u.action) {
      const paths = reachable(g, u);
      let best = { x: u.x, y: u.y },
        score = -Infinity;
      for (const path of paths.values()) {
        const p = path.at(-1) ?? u;
        const near = Math.min(...enemies().map((t) => distance(p, t)));
        const valid = enemies().filter(
          (t) => distance(p, t) <= classes[u.cls].range && lineOfSight(p, t),
        ).length;
        const s =
          valid * 100 -
          near -
          path.length * 0.1 -
          (board[p.y][p.x] === "!" ? 20 : 0);
        if (s > score) {
          best = p;
          score = s;
        }
      }
      if (distance(best, u)) move(g, best);
      if (u.cls === "Clérigo") {
        const ally = g.units
          .filter((v) => v.team === "party" && v.hp > 0 && v.hp < v.maxHp - 5)
          .find((v) => !canUse(g, "bless", v));
        if (ally) use(g, "bless", ally.id);
      }
      const skill = classes[u.cls].skill;
      const t = enemies()
        .sort((a, b) => a.hp - b.hp)
        .find((t) => !canUse(g, skill, t));
      if (t) use(g, skill, t.id);
      const basic = enemies()
        .sort((a, b) => a.hp - b.hp)
        .find((t) => !canUse(g, "attack", t));
      if (basic) use(g, "attack", basic.id);
    }
    endTurn(g);
  }
  expect(g.result).toBe("victory");
});
