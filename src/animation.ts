import type { CombatEvent } from "./combat-events";
import type { Class } from "./content";
import type { Pos } from "./engine";
export type ActionEffect =
  | "walk"
  | "arrow"
  | "volley"
  | "firebolt"
  | "fireball"
  | "breath"
  | "frost"
  | "radiant"
  | "heal"
  | "shield"
  | "rage"
  | "mark"
  | "potion"
  | "melee"
  | "cleave"
  | "bash"
  | "wait";
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const phase = (p: number, start: number, end: number) =>
  clamp((p - start) / (end - start));
export function effectFor(e: CombatEvent, cls: Class): ActionEffect {
  if (e.kind === "move") return "walk";
  if (e.kind === "wait") return "wait";
  const effects: Record<string, ActionEffect> = {
    volley: "volley",
    pin: "arrow",
    nova: "fireball",
    breath: "breath",
    frost: "frost",
    bless: "heal",
    radiance: "radiant",
    guard: "shield",
    rage: "rage",
    expose: "mark",
    potion: "potion",
    cleave: "cleave",
    bash: "bash",
    ambush: "melee",
  };
  if (e.abilityId && effects[e.abilityId]) return effects[e.abilityId];
  return cls === "Explorador"
    ? "arrow"
    : cls === "Mago"
      ? "firebolt"
      : cls === "Clérigo"
        ? "radiant"
        : "melee";
}
export const impactPoint = (effect: ActionEffect) =>
  effect === "walk"
    ? 0.9
    : effect === "volley"
      ? 0.66
      : ["melee", "bash", "cleave"].includes(effect)
        ? 0.43
        : 0.6;
export function playbackDuration(e: CombatEvent, fast: boolean) {
  const normal =
    e.kind === "move"
      ? Math.max(1500, e.path.length * 300 + 450)
      : e.kind === "wait"
        ? 1500
        : 3200;
  return fast ? Math.max(260, normal * 0.18) : normal;
}
/** Sample consecutive orthogonal steps, never a diagonal shortcut through a wall. */
export function samplePath(
  from: Pos,
  path: Pos[],
  progress: number,
): Pos & { dx: number; dy: number; step: number } {
  if (!path.length) return { ...from, dx: 1, dy: 0, step: 0 };
  const t = clamp(progress) * path.length,
    index = Math.min(path.length - 1, Math.floor(t)),
    a = index === 0 ? from : path[index - 1],
    b = path[index],
    f = progress >= 1 ? 1 : t - index;
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    dx: b.x - a.x,
    dy: b.y - a.y,
    step: index + f,
  };
}
export const lerp = (a: Pos, b: Pos, t: number): Pos => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export function arcPoint(a: Pos, b: Pos, t: number, height: number): Pos {
  const p = lerp(a, b, t);
  return { x: p.x, y: p.y - Math.sin(Math.PI * t) * height };
}
