import {
  abilities,
  classes,
  classSkills,
  defaultStats,
  pointCost,
  XP_THRESHOLDS,
  type Class,
  type Race,
  type Stats,
} from "./content";
export type Pos = { x: number; y: number };
export type Status = {
  kind: "guard" | "rage" | "slow" | "root" | "bless" | "mark";
  turns: number;
};
export interface Unit extends Pos {
  id: string;
  name: string;
  race: Race;
  cls: Class;
  team: "party" | "enemy";
  hp: number;
  maxHp: number;
  def: number;
  stats: Stats;
  initiative: number;
  move: number;
  action: number;
  bonus: number;
  reaction: number;
  resource: number;
  breath: number;
  potion: number;
  luck: boolean;
  tenacity: boolean;
  statuses: Status[];
  level: number;
  xp: number;
  inventory: string[];
  equipment: string;
  ai?: "fighter" | "archer" | "caster";
}
export interface Game {
  version: 1;
  units: Unit[];
  order: string[];
  turn: number;
  round: number;
  log: string[];
  seed: number;
  result: "playing" | "victory" | "defeat";
  rewarded: boolean;
}
export const board = [
  "##############",
  "#....#.......#",
  "#....#..c....#",
  "#..c.....#...#",
  "#....#...#...#",
  "#....#.......#",
  "#..c....c....#",
  "#....#..!...c#",
  "#....#.......#",
  "##############",
];
export const mod = (v: number) => Math.floor((v - 10) / 2);
export const distance = (a: Pos, b: Pos) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const tile = (p: Pos) => board[p.y]?.[p.x] ?? "#";
export const active = (g: Game) =>
  g.units.find((u) => u.id === g.order[g.turn])!;
export const has = (u: Unit, s: Status["kind"]) =>
  u.statuses.some((x) => x.kind === s);
export function createUnit(
  id: string,
  name: string,
  race: Race,
  cls: Class,
  stats: Stats,
  x: number,
  y: number,
  team: Unit["team"] = "party",
): Unit {
  if (
    Object.values(stats).some((v) => !Number.isInteger(v) || v < 8 || v > 15) ||
    pointCost(stats) > 27
  )
    throw Error("Atributos inválidos");
  const c = classes[cls],
    maxHp = c.hp + mod(stats.Constitución) * 2 + (race === "Enano" ? 3 : 0);
  return {
    id,
    name,
    race,
    cls,
    stats: { ...stats },
    x,
    y,
    team,
    hp: maxHp,
    maxHp,
    def: c.def + (race === "Mediano" ? 1 : 0),
    initiative: 0,
    move: 0,
    action: 1,
    bonus: 0,
    reaction: 1,
    resource: 3 + (race === "Humano" ? 1 : 0),
    breath: 1,
    potion: 1,
    luck: true,
    tenacity: true,
    statuses: [],
    level: 1,
    xp: 0,
    inventory: ["Poción de curación"],
    equipment: c.gear,
  };
}
export function roll(g: Game, sides: number): number {
  g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0;
  return 1 + Math.floor((g.seed / 4294967296) * sides);
}
function note(g: Game, s: string) {
  g.log.push(s);
  if (g.log.length > 150) g.log.shift();
}
export function newGame(party: Unit[], seed = Date.now() >>> 0): Game {
  if (party.length !== 4) throw Error("Se requieren cuatro aventureros");
  const enemies = [
    createUnit(
      "e1",
      "Centinela de hierro",
      "Humano",
      "Guerrero",
      defaultStats("Guerrero"),
      10,
      4,
      "enemy",
    ),
    createUnit(
      "e2",
      "Arquera ceniza",
      "Elfo",
      "Explorador",
      defaultStats("Explorador"),
      11,
      2,
      "enemy",
    ),
    createUnit(
      "e3",
      "Brujo del paso",
      "Humano",
      "Mago",
      defaultStats("Mago"),
      11,
      7,
      "enemy",
    ),
  ];
  enemies.forEach((u, i) => {
    u.ai = (["fighter", "archer", "caster"] as const)[i];
    u.hp = u.maxHp = Math.floor(u.maxHp * 0.8);
  });
  const units = structuredClone([...party, ...enemies]);
  const g: Game = {
    version: 1,
    units,
    order: [],
    turn: 0,
    round: 1,
    log: [],
    seed,
    result: "playing",
    rewarded: false,
  };
  units.forEach((u) => {
    const d = roll(g, 20);
    u.initiative = d + mod(u.stats.Destreza);
    note(
      g,
      `${u.name}: iniciativa ${d} + ${mod(u.stats.Destreza)} = ${u.initiative}`,
    );
  });
  g.order = units
    .slice()
    .sort(
      (a, b) =>
        b.initiative - a.initiative ||
        b.stats.Destreza - a.stats.Destreza ||
        a.id.localeCompare(b.id),
    )
    .map((u) => u.id);
  begin(g);
  return g;
}
export function lineOfSight(a: Pos, b: Pos): boolean {
  // Exact integer supercover traversal; both sides of a corner must be clear.
  const nx = Math.abs(b.x - a.x),
    ny = Math.abs(b.y - a.y);
  const sx = Math.sign(b.x - a.x),
    sy = Math.sign(b.y - a.y);
  let x = a.x,
    y = a.y,
    ix = 0,
    iy = 0;
  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx;
    if (decision === 0) {
      if (tile({ x: x + sx, y }) === "#" || tile({ x, y: y + sy }) === "#")
        return false;
      x += sx;
      y += sy;
      ix++;
      iy++;
    } else if (decision < 0) {
      x += sx;
      ix++;
    } else {
      y += sy;
      iy++;
    }
    if (tile({ x, y }) === "#") return false;
  }
  return true;
}
const nearCover = (u: Pos) =>
  [
    { x: u.x + 1, y: u.y },
    { x: u.x - 1, y: u.y },
    { x: u.x, y: u.y + 1 },
    { x: u.x, y: u.y - 1 },
  ].some((p) => tile(p) === "c");
export function defense(g: Game, u: Unit, attacker: Pos): number {
  return (
    u.def +
    (has(u, "bless") ? 2 : 0) -
    (has(u, "mark") ? 2 : 0) +
    (has(u, "rage") ? -2 : 0) +
    (distance(u, attacker) > 1 && nearCover(u) ? 2 : 0) +
    (u.race === "Enano" && nearCover(u) ? 1 : 0) +
    (g.units.some(
      (v) =>
        v.hp > 0 &&
        v.team === u.team &&
        v.id !== u.id &&
        has(v, "guard") &&
        distance(v, u) <= 1,
    )
      ? 2
      : 0)
  );
}
export function reachable(
  g: Game,
  u: Unit,
  budget = u.move,
): Map<string, Pos[]> {
  const found = new Map<string, Pos[]>([[`${u.x},${u.y}`, []]]),
    queue: Pos[] = [u];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      path = found.get(`${p.x},${p.y}`)!;
    if (path.length >= budget || has(u, "root")) continue;
    for (const d of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const q = { x: p.x + d.x, y: p.y + d.y },
        key = `${q.x},${q.y}`;
      if (
        found.has(key) ||
        tile(q) === "#" ||
        tile(q) === "c" ||
        g.units.some((v) => v.hp > 0 && v.id !== u.id && distance(v, q) === 0)
      )
        continue;
      if (
        g.units.some(
          (v) =>
            v.hp > 0 &&
            v.team !== u.team &&
            has(v, "guard") &&
            distance(v, p) <= 1 &&
            distance(v, q) > 1,
        )
      )
        continue;
      found.set(key, [...path, q]);
      queue.push(q);
    }
  }
  return found;
}
function hurt(g: Game, target: Unit, n: number, type: string) {
  if (
    (target.race === "Dracónido" && type === "fire") ||
    (target.race === "Enano" && type === "poison") ||
    (has(target, "rage") && type === "physical")
  )
    n = Math.floor(n / 2);
  // The iron sentinel is vulnerable to cold; content can add further resistances.
  if (target.ai === "fighter" && type === "cold") n *= 2;
  target.hp = Math.max(0, target.hp - n);
  if (target.hp === 0 && target.race === "Orco" && target.tenacity) {
    target.hp = 1;
    target.tenacity = false;
    note(g, `${target.name} resiste con tenacidad (1 PV).`);
  }
  note(
    g,
    `${target.name} recibe ${n} de ${{ physical: "físico", cold: "frío", fire: "fuego", radiant: "radiante", poison: "veneno" }[type] ?? type}.`,
  );
}
export function move(g: Game, p: Pos): boolean {
  const u = active(g);
  if (g.result !== "playing" || u.hp <= 0) return false;
  const path = reachable(g, u).get(`${p.x},${p.y}`);
  if (!path?.length) return false;
  for (const step of path) {
    u.x = step.x;
    u.y = step.y;
    u.move--;
    if (tile(step) === "!") hurt(g, u, 3, "fire");
    if (u.hp <= 0) break;
  }
  note(g, `${u.name} se mueve ${path.length} casillas.`);
  outcome(g);
  return true;
}
function status(u: Unit, kind: Status["kind"], turns: number) {
  if (kind === "slow" && u.race === "Elfo") turns--;
  if (turns <= 0) return;
  const old = u.statuses.find((s) => s.kind === kind);
  if (old) old.turns = Math.max(old.turns, turns);
  else u.statuses.push({ kind, turns });
}
export function canUse(g: Game, id: string, target: Unit): string | null {
  const u = active(g),
    a = abilities[id];
  if (!a) return "Habilidad desconocida";
  if (g.result !== "playing" || u.hp <= 0)
    return "Combate terminado o actor caído";
  if (
    ![
      "attack",
      "potion",
      ...classSkills(u.cls),
      ...(u.race === "Dracónido" ? ["breath"] : []),
    ].includes(id)
  )
    return "Habilidad no aprendida";
  if (id === "potion" ? u.action < 1 && u.bonus < 1 : u.action < 1)
    return "No quedan acciones";
  if (u.resource < a.cost) return "Recursos insuficientes";
  if (target.hp <= 0) return "Objetivo caído";
  if (
    (a.target === "enemy" && target.team === u.team) ||
    (a.target === "ally" && target.team !== u.team) ||
    (a.target === "self" && target.id !== u.id)
  )
    return "Objetivo no permitido";
  if (
    distance(u, target) > (id === "attack" ? classes[u.cls].range : a.range) ||
    !lineOfSight(u, target)
  )
    return "Fuera de alcance o sin línea de visión";
  if (id === "breath" && u.breath < 1) return "Aliento agotado";
  if (id === "potion" && u.potion < 1) return "Sin pociones";
  if (id === "rage" && has(u, "rage")) return "Furia ya activa";
  if (
    id === "ambush" &&
    !has(target, "root") &&
    !g.units.some(
      (v) =>
        v.id !== u.id &&
        v.team === u.team &&
        v.hp > 0 &&
        distance(v, target) <= 1,
    )
  )
    return "Requiere objetivo inmovilizado o distraído";
  return null;
}
export function use(g: Game, id: string, targetId: string): boolean {
  const u = active(g),
    t = g.units.find((v) => v.id === targetId);
  if (!t || canUse(g, id, t)) return false;
  const a = abilities[id];
  if (id === "potion" && u.bonus > 0) u.bonus--;
  else u.action--;
  u.resource -= a.cost;
  note(g, `${u.name} usa ${a.name}.`);
  if (id === "potion") {
    u.potion--;
    u.inventory = u.inventory.filter((v) => v !== "Poción de curación");
    u.hp = Math.min(u.maxHp, u.hp + 8);
  } else if (a.effect === "guard" || a.effect === "rage") {
    status(u, a.effect, a.duration + 1);
    if (a.effect === "rage") u.bonus = 1;
  } else if (a.effect === "mark") {
    status(t, "mark", a.duration);
    note(g, `${t.name} queda expuesto: −2 defensa.`);
  } else if (a.effect === "heal") {
    const n = roll(g, 6) + Math.max(0, mod(u.stats.Sabiduría));
    t.hp = Math.min(t.maxHp, t.hp + n);
    status(t, "bless", a.duration);
    note(g, `${t.name} recupera ${n} PV y gana +2 defensa.`);
  } else if (a.effect === "slow" || a.effect === "area") {
    if (id === "breath") u.breath--;
    for (const v of g.units.filter(
      (v) =>
        v.hp > 0 &&
        v.team !== u.team &&
        distance(v, t) <= (a.radius ?? 1) &&
        lineOfSight(t, v),
    )) {
      hurt(
        g,
        v,
        roll(g, a.die ?? 6) +
          Math.max(
            0,
            mod(
              u.stats[
                a.attribute ??
                  (id === "breath" ? "Constitución" : "Inteligencia")
              ],
            ) + (a.damageType === "physical" && has(u, "rage") ? 3 : 0),
          ),
        a.damageType,
      );
      if (a.effect === "slow") status(v, "slow", a.duration);
    }
    if (a.healing)
      for (const ally of g.units.filter(
        (v) =>
          v.hp > 0 &&
          v.team === u.team &&
          distance(v, t) <= (a.radius ?? 1) &&
          lineOfSight(t, v),
      )) {
        const amount = Math.min(a.healing, ally.maxHp - ally.hp);
        ally.hp += amount;
        note(g, `${ally.name} recupera ${amount} PV por Luz del alba.`);
      }
  } else {
    let d = roll(g, 20);
    if (d === 1 && u.race === "Mediano" && u.luck) {
      u.luck = false;
      note(g, "Suerte mediana: repite un 1.");
      d = roll(g, 20);
    }
    const bonus = 2 + mod(u.stats[classes[u.cls].stat]),
      def = defense(g, t, u),
      hit = d === 20 || (d !== 1 && d + bonus >= def);
    note(
      g,
      `d20 ${d} + ${bonus} vs defensa ${def}: ${hit ? (d === 20 ? "CRÍTICO" : "impacto") : "fallo"}.`,
    );
    if (hit) {
      const weapon = roll(g, classes[u.cls].die),
        crit = d === 20 ? roll(g, classes[u.cls].die) : 0,
        attribute = Math.max(0, mod(u.stats[classes[u.cls].stat])),
        rage = has(u, "rage") ? 3 : 0,
        sneak = id === "ambush" ? roll(g, 6) : 0;
      let n = weapon + crit + attribute + rage + sneak;
      note(
        g,
        `Daño: d${classes[u.cls].die} (${weapon}) + crítico ${crit} + atributo ${attribute} + furia ${rage} + oportunismo ${sneak} = ${n}, antes de resistencias.`,
      );
      hurt(
        g,
        t,
        n,
        id === "attack" && u.cls === "Mago"
          ? "fire"
          : id === "attack" && u.cls === "Clérigo"
            ? "radiant"
            : a.damageType,
      );
      if (a.effect === "root") status(t, "root", a.duration);
      const protector = g.units.find(
        (v) =>
          v.hp > 0 &&
          v.team === t.team &&
          has(v, "guard") &&
          v.reaction > 0 &&
          distance(v, u) <= 1,
      );
      if (protector) {
        protector.reaction--;
        hurt(g, u, 3, "physical");
        note(g, `${protector.name}: reacción de represalia.`);
      }
    }
  }
  outcome(g);
  return true;
}
function begin(g: Game) {
  const u = active(g);
  u.action = 1;
  u.bonus = 0;
  u.reaction = 1;
  u.move = has(u, "root")
    ? 0
    : Math.max(
        1,
        classes[u.cls].move +
          (u.race === "Elfo" ? 1 : 0) -
          (has(u, "slow") ? 2 : 0),
      );
  note(g, `Ronda ${g.round}: turno de ${u.name}.`);
}
export function outcome(g: Game) {
  if (!g.units.some((u) => u.team === "party" && u.hp > 0)) g.result = "defeat";
  else if (!g.units.some((u) => u.team === "enemy" && u.hp > 0))
    g.result = "victory";
  if (g.result === "victory" && !g.rewarded) {
    g.rewarded = true;
    g.units
      .filter((u) => u.team === "party")
      .forEach((u) => {
        u.xp += 100;
        while (u.level < 5 && u.xp >= XP_THRESHOLDS[u.level]) {
          u.level++;
          u.maxHp += 4;
          if (u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + 4);
        }
      });
    note(
      g,
      "Victoria: cada aventurero recibe 100 PX y alcanza nivel 2 (+4 PV).",
    );
  }
}
export function endTurn(g: Game) {
  if (g.result !== "playing") return;
  const u = active(g);
  u.statuses = u.statuses
    .map((s) => ({ ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0);
  outcome(g);
  if (g.result !== "playing") return;
  do {
    g.turn = (g.turn + 1) % g.order.length;
    if (g.turn === 0) g.round++;
  } while (active(g).hp <= 0);
  begin(g);
}
export function aiTurn(g: Game) {
  const u = active(g);
  if (u.team !== "enemy" || g.result !== "playing") return;
  const targets = () =>
    g.units
      .filter((v) => v.team !== u.team && v.hp > 0)
      .sort((a, b) => a.hp + distance(u, a) * 2 - (b.hp + distance(u, b) * 2));
  const paths = reachable(g, u);
  let best: Pos = u,
    score = -Infinity;
  for (const [key, path] of paths) {
    const p = path.at(-1) ?? u;
    const nearest = Math.min(...targets().map((v) => distance(p, v)));
    const sees = targets().some(
      (v) => lineOfSight(p, v) && distance(p, v) <= classes[u.cls].range,
    );
    const value =
      u.ai === "fighter"
        ? -nearest * 4
        : (sees ? 12 : 0) -
          Math.abs(nearest - 4) * 2 +
          (nearCover(p) ? 3 : 0) -
          (tile(p) === "!" ? 10 : 0) -
          path.length * 0.1;
    if (value > score) {
      score = value;
      best = p;
    }
    void key;
  }
  if (distance(best, u) > 0) move(g, best);
  if (g.result !== "playing") return;
  let done = false;
  if (u.ai === "caster" || u.ai === "archer") {
    const skill = u.ai === "caster" ? "frost" : "pin";
    const t = targets().find((t) => !canUse(g, skill, t));
    if (t) done = use(g, skill, t.id);
  }
  if (!done) {
    const t = targets().find((t) => !canUse(g, "attack", t));
    if (t) done = use(g, "attack", t.id);
  }
  if (!done && u.ai === "fighter" && !has(u, "guard")) use(g, "guard", u.id);
  endTurn(g);
}
export const save = (g: Game) => JSON.stringify(g);
export function load(raw: string): Game {
  const g = JSON.parse(raw) as Game;
  if (
    g.version !== 1 ||
    !Array.isArray(g.units) ||
    g.units.length !== 7 ||
    !Array.isArray(g.order) ||
    g.order.length !== 7 ||
    new Set(g.order).size !== 7 ||
    g.order.some((id) => !g.units.some((u) => u.id === id)) ||
    !Number.isInteger(g.turn) ||
    g.turn < 0 ||
    g.turn >= 7 ||
    !Number.isInteger(g.seed) ||
    !["playing", "victory", "defeat"].includes(g.result) ||
    !Array.isArray(g.log)
  )
    throw Error("Guardado incompatible o dañado");
  for (const u of g.units) {
    if (
      !classes[u.cls] ||
      !u.stats ||
      !Array.isArray(u.statuses) ||
      !Number.isFinite(u.hp) ||
      !Number.isFinite(u.maxHp) ||
      u.hp < 0 ||
      u.hp > u.maxHp ||
      tile(u) === "#" ||
      !Number.isInteger(u.x) ||
      !Number.isInteger(u.y) ||
      !Number.isFinite(u.resource) ||
      !Array.isArray(u.inventory)
    )
      throw Error("Personaje inválido");
  }
  return g;
}

export function hitChance(g: Game, id: string, t: Unit): number | null {
  if (canUse(g, id, t)) return null;
  if (!["damage", "root"].includes(abilities[id].effect)) return 100;
  const u = active(g),
    needed = defense(g, t, u) - 2 - mod(u.stats[classes[u.cls].stat]);
  return Math.max(5, Math.min(95, (21 - needed) * 5));
}
export function enemyIntent(g: Game, u: Unit): string {
  if (u.hp <= 0) return "Fuera de combate";
  const target = g.units
    .filter((v) => v.hp > 0 && v.team !== u.team)
    .sort((a, b) => a.hp + distance(u, a) * 2 - (b.hp + distance(u, b) * 2))[0];
  const behavior =
    u.ai === "fighter"
      ? "Acercarse y cerrar el paso"
      : u.ai === "archer"
        ? "Buscar tiro de sujeción y mantener distancia"
        : "Buscar un grupo para lanzar escarcha";
  return `${behavior}${target ? " · amenaza a " + target.name : ""}`;
}
