import type { Game, Unit, Pos, Status } from "./engine";
export interface CombatEvent {
  id: number;
  round: number;
  kind: "move" | "ability" | "wait";
  actorId: string;
  actorName: string;
  team: Unit["team"];
  name: string;
  targetId?: string;
  targetName?: string;
  abilityId?: string;
  from: Pos;
  to: Pos;
  path: Pos[];
  details: string[];
  effects: {
    id: string;
    name: string;
    hpBefore: number;
    hpAfter: number;
    statuses: Status[];
  }[];
  costs: { action: number; bonus: number; resources: number; movement: number };
}
export function startRecord(g: Game) {
  return {
    units: structuredClone(g.units),
    actor: structuredClone(g.units.find((u) => u.id === g.order[g.turn])!),
    sequence: g.logSequence ?? 0,
  };
}
export function finishRecord(
  g: Game,
  before: ReturnType<typeof startRecord>,
  data: Pick<CombatEvent, "kind" | "name"> &
    Partial<
      Pick<CombatEvent, "targetId" | "targetName" | "abilityId" | "path">
    >,
) {
  const u = g.units.find((u) => u.id === before.actor.id)!;
  const count = (g.logSequence ?? 0) - before.sequence;
  const event: CombatEvent = {
    id: (g.eventSequence ?? 0) + 1,
    round: g.round,
    actorId: u.id,
    actorName: u.name,
    team: u.team,
    ...data,
    from: { x: before.actor.x, y: before.actor.y },
    to: { x: u.x, y: u.y },
    path: data.path ?? [],
    details: count ? g.log.slice(-Math.min(count, 150)) : [],
    effects: g.units.flatMap((v) => {
      const old = before.units.find((o) => o.id === v.id)!;
      const statuses = v.statuses.filter(
        (s) =>
          !old.statuses.some((o) => o.kind === s.kind && o.turns >= s.turns),
      );
      return old.hp !== v.hp || statuses.length
        ? [
            {
              id: v.id,
              name: v.name,
              hpBefore: old.hp,
              hpAfter: v.hp,
              statuses: structuredClone(statuses),
            },
          ]
        : [];
    }),
    costs: {
      action: Math.max(0, before.actor.action - u.action),
      bonus: Math.max(0, before.actor.bonus - u.bonus),
      resources: Math.max(0, before.actor.resource - u.resource),
      movement: Math.max(0, before.actor.move - u.move),
    },
  };
  g.eventSequence = event.id;
  g.events = [...(g.events ?? []), event].slice(-80);
  return event;
}
export const zone = (p: Pos) =>
  p.x < 5 ? "patio occidental" : p.x < 9 ? "paso central" : "ruinas orientales";
