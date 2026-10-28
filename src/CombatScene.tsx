import type { Game, Pos, Unit } from "./engine";
import { active, distance, lineOfSight, tile } from "./engine";
import type { CombatEvent } from "./combat-events";
import { abilities } from "./content";
import {
  arcPoint,
  clamp,
  effectFor,
  impactPoint,
  lerp,
  phase,
  samplePath,
  type ActionEffect,
} from "./animation";
import { Miniature } from "./Miniature";
const center = (p: Pos): Pos => ({ x: p.x + 0.5, y: p.y + 0.5 });
const pathText = (p: Pos[]) => p.map((v) => `${v.x},${v.y}`).join(" ");
function Arrow({
  from,
  to,
  t,
  lift = 0,
}: {
  from: Pos;
  to: Pos;
  t: number;
  lift?: number;
}) {
  const point = arcPoint(from, to, t, lift),
    next = arcPoint(from, to, Math.min(1, t + 0.01), lift),
    angle =
      t >= 1
        ? (Math.atan2(to.y - from.y + lift * 3, to.x - from.x) * 180) / Math.PI
        : (Math.atan2(next.y - point.y, next.x - point.x) * 180) / Math.PI;
  return (
    <g
      className="flying-arrow"
      data-x={point.x.toFixed(3)}
      data-y={point.y.toFixed(3)}
      transform={`translate(${point.x},${point.y}) rotate(${angle})`}
    >
      <path d="M-.38 0 H.15" stroke="#e6c294" strokeWidth=".032" />
      <path
        d="M.15 0 L.03 -.07 L.22 0 L.03 .07Z"
        fill="#dedfce"
        stroke="#39473b"
        strokeWidth=".012"
      />
      <path
        d="M-.27 0 L-.38 -.06 M-.27 0 L-.38 .06"
        stroke="#dcaa7b"
        strokeWidth=".04"
      />
    </g>
  );
}
function Burst({
  at,
  progress,
  kind,
}: {
  at: Pos;
  progress: number;
  kind: "fire" | "ice" | "light" | "physical" | "heal";
}) {
  const t = clamp(progress),
    alpha =
      kind === "fire" ? Math.pow(1 - t, 0.6) * 0.95 : Math.sin(t * Math.PI);
  if (alpha <= 0) return null;
  const color =
    kind === "fire"
      ? "#ffae42"
      : kind === "ice"
        ? "#b7e9ff"
        : kind === "heal"
          ? "#aef6ac"
          : kind === "physical"
            ? "#ecd2a6"
            : "#fff0a4";
  return (
    <g
      className={`impact-burst ${kind}`}
      data-impact-progress={t.toFixed(3)}
      opacity={alpha}
      transform={`translate(${at.x},${at.y})`}
    >
      <ellipse
        rx={0.22 + t * 0.65}
        ry={0.12 + t * 0.32}
        fill="none"
        stroke={color}
        strokeWidth={0.06 * (1 - t) + 0.01}
      />
      {Array.from({ length: kind === "fire" ? 15 : 10 }, (_, i) => {
        const angle = i * 2.39996,
          radius = 0.1 + (0.3 + (i % 3) * 0.18) * t,
          x = Math.cos(angle) * radius,
          y = Math.sin(angle) * radius * 0.6 - t * 0.2;
        if (kind === "fire")
          return (
            <path
              key={i}
              d={`M${x - 0.08} ${y + 0.12} Q${x - 0.17} ${y - 0.12} ${x + 0.03} ${y - 0.35 - (i % 3) * 0.08} Q${x + 0.02} ${y - 0.03} ${x + 0.1} ${y - 0.15} Q${x + 0.2} ${y + 0.04} ${x - 0.08} ${y + 0.12}`}
              fill={i % 2 ? "#ff8c31" : "#ffdb75"}
              opacity={0.9 - (i % 3) * 0.15}
            />
          );
        if (kind === "ice")
          return (
            <path
              key={i}
              d={`M${x} ${y - 0.3} L${x + 0.09} ${y} L${x} ${y + 0.12} L${x - 0.06} ${y}Z`}
              fill="#c2efff"
              stroke="#f3ffff"
              strokeWidth=".015"
            />
          );
        return (
          <path
            key={i}
            d={`M${x - 0.035} ${y} H${x + 0.035} M${x} ${y - 0.06} V${y + 0.06}`}
            stroke={color}
            strokeWidth=".025"
          />
        );
      })}
    </g>
  );
}
function SpellEffects({
  event,
  g,
  progress,
  reduced,
}: {
  event: CombatEvent;
  g: Game;
  progress: number;
  reduced: boolean;
}) {
  const actor = g.units.find((u) => u.id === event.actorId);
  if (!actor || event.kind !== "ability") return null;
  const kind = effectFor(event, event.actorClass ?? actor.cls),
    from = center(event.from),
    target =
      event.targetPosition ??
      g.units.find((u) => u.id === event.targetId) ??
      event.to,
    to = center(target),
    impact = impactPoint(kind),
    hit = progress >= impact;
  const flight = phase(progress, 0.2, impact),
    burst = phase(progress, impact, 0.97),
    miss = event.details.some((s) => s.includes(": fallo"));
  const direction = Math.sign(to.x - from.x) || 1;
  const launch = { x: from.x + direction * 0.24, y: from.y - 0.25 };
  const mouth = { x: from.x + direction * 0.16, y: from.y - 0.42 };
  const aim = miss ? { x: to.x + 0.4, y: to.y - 0.18 } : to;
  const affected = event.effects
    .filter((e) => e.hpAfter < e.hpBefore)
    .map((e) =>
      center(e.position ?? g.units.find((u) => u.id === e.id) ?? target),
    );
  const damaged = affected.length ? affected : [to];
  const tint = ["fireball", "firebolt", "breath", "rage"].includes(kind)
    ? "#ffaf51"
    : kind === "frost"
      ? "#a8deff"
      : "#f2df92";
  const staticProgress = reduced ? 0.55 : progress;
  const clipCells = Array.from({ length: 140 }, (_, i) => ({
    x: i % 14,
    y: Math.floor(i / 14),
  })).filter(
    (p) =>
      tile(p) !== "#" &&
      distance(p, target) <= (abilities[event.abilityId ?? ""]?.radius ?? 1) &&
      lineOfSight(target, p),
  );
  const visibleFlight = progress >= 0.2 && progress < impact && !reduced;
  const clipId = `effect-area-${event.id}`;
  return (
    <g
      className={`action-effect ${kind}`}
      data-effect={kind}
      data-stage={hit ? "impact" : progress < 0.2 ? "preparation" : "flight"}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          {clipCells.map((p) => (
            <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width="1" height="1" />
          ))}
        </clipPath>
      </defs>
      {progress < impact &&
        ["fireball", "firebolt", "frost", "radiant", "heal", "breath"].includes(
          kind,
        ) && (
          <g
            className="cast-charge"
            opacity={0.4 + phase(progress, 0, 0.2) * 0.6}
          >
            <circle
              cx={launch.x}
              cy={launch.y}
              r={0.06 + phase(progress, 0, 0.2) * 0.12}
              fill={tint}
            />
            <circle
              cx={launch.x}
              cy={launch.y}
              r={0.13 + phase(progress, 0, 0.2) * 0.15}
              fill="none"
              stroke={tint}
              strokeWidth=".025"
            />
          </g>
        )}
      {kind === "arrow" && visibleFlight && (
        <Arrow from={launch} to={aim} t={flight} lift={0.12} />
      )}
      {kind === "volley" &&
        !reduced &&
        Array.from({ length: 9 }, (_, i) => {
          const start = 0.17 + i * 0.025,
            end = start + 0.28,
            t = phase(progress, start, end);
          const base = damaged[i % damaged.length],
            landing = {
              x: base.x + Math.cos(i * 2.4) * 0.16,
              y: base.y + Math.sin(i * 2.4) * 0.12,
            };
          return progress >= start && progress < end ? (
            <Arrow
              key={i}
              from={{ x: launch.x, y: launch.y - 0.1 }}
              to={landing}
              t={t}
              lift={1.5 + (i % 3) * 0.2}
            />
          ) : null;
        })}
      {["fireball", "firebolt", "frost", "radiant"].includes(kind) &&
        visibleFlight && (
          <g
            className="spell-projectile"
            data-x={lerp(launch, to, flight).x.toFixed(3)}
            transform={`translate(${lerp(launch, to, flight).x},${lerp(launch, to, flight).y})`}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const trail = lerp(launch, to, Math.max(0, flight - i * 0.035)),
                p = lerp(launch, to, flight);
              return (
                <circle
                  key={i}
                  cx={trail.x - p.x}
                  cy={trail.y - p.y}
                  r={Math.max(
                    0.02,
                    (kind === "fireball" ? 0.15 : 0.085) - i * 0.025,
                  )}
                  fill={tint}
                  opacity={1 - i * 0.16}
                />
              );
            })}
            <circle
              r={kind === "fireball" ? 0.17 : 0.09}
              fill={kind === "frost" ? "#dbf8ff" : "#fff1ad"}
            />
          </g>
        )}
      {kind === "breath" && progress > 0.15 && progress < 0.85 && (
        <path
          className="dragon-flame"
          d={`M${mouth.x} ${mouth.y - 0.07} Q${(mouth.x + to.x) / 2} ${to.y - 0.55} ${to.x + direction * 0.3} ${to.y} Q${(mouth.x + to.x) / 2} ${to.y + 0.35} ${mouth.x} ${mouth.y + 0.07}`}
          fill="#ff9d3d"
          opacity={Math.sin(phase(progress, 0.15, 0.85) * Math.PI) * 0.65}
          stroke="#ffdf7a"
          strokeWidth=".04"
        />
      )}
      {hit && !miss && ["fireball", "breath"].includes(kind) && (
        <g clipPath={`url(#${clipId})`}>
          <Burst at={to} progress={reduced ? 0.5 : burst} kind="fire" />
          {affected.map((p, i) => (
            <Burst
              key={i}
              at={p}
              progress={reduced ? 0.5 : burst}
              kind="fire"
            />
          ))}
        </g>
      )}
      {hit &&
        !miss &&
        [
          "arrow",
          "volley",
          "firebolt",
          "frost",
          "radiant",
          "melee",
          "cleave",
          "bash",
        ].includes(kind) &&
        damaged.map((p, i) => (
          <Burst
            key={i}
            at={p}
            progress={reduced ? 0.5 : burst}
            kind={
              kind === "frost"
                ? "ice"
                : kind === "firebolt"
                  ? "fire"
                  : kind === "radiant"
                    ? "light"
                    : "physical"
            }
          />
        ))}
      {["melee", "cleave", "bash"].includes(kind) &&
        progress > 0.22 &&
        progress < 0.7 && (
          <g
            className="weapon-slash"
            transform={`translate(${to.x},${to.y - 0.1}) rotate(${staticProgress * 240 - 120})`}
            opacity={Math.sin(phase(progress, 0.22, 0.7) * Math.PI)}
          >
            <path
              d="M-.48 -.2 Q.22 -.8 .5 .25"
              fill="none"
              stroke={kind === "bash" ? "#a1d8ea" : "#ffe2af"}
              strokeWidth={kind === "cleave" ? ".12" : ".07"}
              strokeLinecap="round"
            />
          </g>
        )}
      {hit &&
        event.effects
          .filter((e) => e.hpAfter > e.hpBefore)
          .map((e) => (
            <Burst
              key={e.id}
              at={center(
                e.position ?? g.units.find((u) => u.id === e.id) ?? target,
              )}
              progress={reduced ? 0.5 : burst}
              kind="heal"
            />
          ))}
      {kind === "heal" && progress > 0.25 && (
        <g
          className="healing-rings"
          transform={`translate(${to.x},${to.y})`}
          opacity={Math.sin(phase(progress, 0.25, 1) * Math.PI)}
        >
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cy={-0.1 - i * 0.15}
              rx={0.3 + Math.sin(staticProgress * 5 + i) * 0.05}
              ry=".09"
              stroke="#f9e7a6"
              strokeWidth=".035"
              fill="none"
            />
          ))}
        </g>
      )}
      {kind === "shield" && progress > 0.2 && (
        <g
          className="shield-aura"
          transform={`translate(${from.x},${from.y - 0.15})`}
          opacity={Math.sin(phase(progress, 0.2, 1) * Math.PI)}
        >
          <path
            d="M-.38 -.4 L0 -.55 L.38 -.4 L.3 .15 L0 .43 L-.3 .15Z"
            fill="#a7d9e333"
            stroke="#d3eeed"
            strokeWidth=".04"
          />
          <path
            d="M0 -.35 V.18 M-.2 -.08 H.2"
            stroke="#fff1b3"
            strokeWidth=".04"
          />
        </g>
      )}
      {kind === "rage" && progress > 0.2 && (
        <Burst
          at={from}
          progress={reduced ? 0.5 : phase(progress, 0.2, 1)}
          kind="fire"
        />
      )}
      {kind === "mark" && progress > 0.25 && (
        <g
          className="weakness-sigil"
          transform={`translate(${to.x},${to.y - 0.55})`}
          opacity={Math.sin(phase(progress, 0.25, 1) * Math.PI)}
        >
          <path
            d="M-.28 0 Q0 -.3 .28 0 Q0 .3 -.28 0Z"
            fill="#201331bb"
            stroke="#e0bdff"
            strokeWidth=".035"
          />
          <circle r=".065" fill="#f5e3ff" />
        </g>
      )}
      {kind === "potion" && progress > 0.2 && (
        <g
          className="potion-bubbles"
          transform={`translate(${from.x + 0.25},${from.y - 0.25})`}
          opacity={Math.sin(phase(progress, 0.2, 1) * Math.PI)}
        >
          <path
            d="M-.04 -.2 H.06 V-.1 Q.2 .12 .01 .15 Q-.2 .12 -.04 -.1Z"
            fill="#86d6a4"
            stroke="#e7ffdd"
            strokeWidth=".025"
          />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={Math.sin(i * 3) * 0.12}
              cy={-0.22 - phase(progress, 0.2, 1) * 0.35 - i * 0.08}
              r=".035"
              fill="#c8f7b7"
            />
          ))}
        </g>
      )}
      {miss && hit && (
        <text
          className="vfx-caption"
          x={to.x}
          y={to.y - 0.55}
          textAnchor="middle"
        >
          FALLO
        </text>
      )}
    </g>
  );
}
export function CombatScene({
  g,
  event,
  progress,
  paused,
  reduced,
}: {
  g: Game;
  event?: CombatEvent;
  progress: number;
  paused: boolean;
  reduced: boolean;
}) {
  const actor = event ? g.units.find((u) => u.id === event.actorId) : undefined;
  const effect =
    event && actor ? effectFor(event, event.actorClass ?? actor.cls) : "wait";
  const impact = reduced ? 0.12 : impactPoint(effect),
    impacted = progress >= impact;
  const visibleUnits = g.units.filter(
    (u) =>
      u.hp > 0 ||
      event?.effects.some(
        (e) => e.id === u.id && e.hpBefore > 0 && progress < 0.98,
      ),
  );
  const positions = visibleUnits
    .map((u) => {
      let p: Pos = { x: u.x, y: u.y },
        dx = u.team === "party" ? 1 : -1,
        dy = 0,
        step = 0,
        walking = false,
        gesture = 0;
      if (event?.actorId === u.id) {
        if (event.kind === "move") {
          const sample = samplePath(
            event.from,
            event.path,
            reduced ? 1 : phase(progress, 0.05, 0.9),
          );
          p = sample;
          dx = sample.dx;
          dy = sample.dy;
          step = sample.step;
          walking = !reduced && progress > 0.05 && progress < 0.9;
        } else if (event.kind === "ability") {
          const target =
            event.targetPosition ??
            g.units.find((v) => v.id === event.targetId) ??
            event.to;
          dx = target.x - u.x || dx;
          dy = target.y - u.y;
          gesture = reduced
            ? 0
            : Math.sin(phase(progress, 0.06, 0.63) * Math.PI);
          if (["melee", "cleave", "bash"].includes(effect) && !reduced) {
            const lunge =
              Math.sin(phase(progress, 0.18, 0.67) * Math.PI) * 0.22;
            const d = Math.hypot(target.x - u.x, target.y - u.y) || 1;
            p = {
              x: u.x + ((target.x - u.x) / d) * lunge,
              y: u.y + ((target.y - u.y) / d) * lunge,
            };
          }
        }
      }
      return { u, p, dx, dy, step, walking, gesture };
    })
    .sort((a, b) => a.p.y - b.p.y);
  return (
    <svg
      className="combat-scene"
      viewBox="0 0 14 10"
      aria-label="Personajes y efectos de combate"
      data-event-id={event?.id ?? ""}
      data-progress={progress.toFixed(3)}
      data-impact={!!event && impacted}
      data-paused={paused}
      data-reduced-motion={reduced}
    >
      <defs>
        <filter id="mini-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy=".025"
            stdDeviation=".025"
            floodColor="#07120a"
            floodOpacity=".85"
          />
        </filter>
      </defs>
      {positions.map(({ u, p, dx, step, walking, gesture }) => {
        const result = event?.effects.find((e) => e.id === u.id),
          hp = result && !impacted ? result.hpBefore : u.hp;
        const hurt = !!result && result.hpAfter < result.hpBefore && impacted;
        const death =
          hp === 0 ? phase(progress, Math.max(impact, 0.6), 0.98) : 0;
        const hit =
          hurt && !reduced
            ? Math.sin(
                phase(progress, impact, Math.min(0.99, impact + 0.2)) * Math.PI,
              )
            : 0;
        const selected = active(g).id === u.id,
          isSource = event?.actorId === u.id,
          isTarget = event?.targetId === u.id;
        return (
          <g
            key={u.id}
            className={`scene-unit ${u.team} ${walking ? "walking" : ""} ${hurt ? "taking-hit" : ""}`}
            data-unit-id={u.id}
            data-x={p.x.toFixed(3)}
            data-y={p.y.toFixed(3)}
            data-hp={hp}
            data-facing={dx < 0 ? "left" : "right"}
            transform={`translate(${p.x + 0.5},${p.y + 0.5})`}
            opacity={1 - death * 0.85}
          >
            <ellipse
              className="unit-shadow"
              cy=".26"
              rx=".28"
              ry=".105"
              fill="#081009"
              opacity=".65"
            />
            <ellipse
              cy=".27"
              rx=".28"
              ry=".11"
              stroke={
                isSource || selected
                  ? "#f5db93"
                  : u.team === "party"
                    ? "#97c9bd"
                    : "#da9c83"
              }
              strokeWidth={isSource || selected ? ".035" : ".018"}
              fill={isTarget ? "#efb36b33" : "none"}
            />
            {walking && (
              <g
                className="footstep-dust"
                opacity={0.22 + Math.abs(Math.sin(step * Math.PI)) * 0.25}
              >
                <ellipse
                  cx={-0.1 * Math.sign(dx)}
                  cy=".26"
                  rx=".17"
                  ry=".065"
                  fill="#dcc597"
                />
              </g>
            )}
            <g
              transform="translate(-.37,-.65) scale(.0074)"
              filter="url(#mini-shadow)"
            >
              <Miniature
                action={isSource ? effect : "wait"}
                cls={u.cls}
                race={u.race}
                walk={step * 1.5}
                walking={walking}
                gesture={gesture}
                facing={dx}
                hit={hit}
                fallen={reduced ? 0 : death}
              />
            </g>
            <rect
              x="-.3"
              y=".33"
              width=".6"
              height=".12"
              rx=".025"
              fill="#0d1b13b8"
            />
            <text className="scene-name" textAnchor="middle" y=".417">
              {u.name.split(" ")[0]}
            </text>
            <rect x="-.3" y=".46" width=".6" height=".034" fill="#172117" />
            <rect
              className="scene-health"
              x="-.3"
              y=".46"
              width={(0.6 * Math.max(0, hp)) / u.maxHp}
              height=".034"
              fill={u.team === "party" ? "#add9a8" : "#e3a386"}
            />
            {!!u.statuses.length && (
              <text className="scene-status" x="-.31" y="-.43">
                {u.statuses
                  .filter(
                    (s) =>
                      impacted ||
                      !result?.statuses.some(
                        (newStatus) => newStatus.kind === s.kind,
                      ),
                  )
                  .map(
                    (s) =>
                      ({
                        guard: "◇",
                        rage: "↑",
                        slow: "❄",
                        root: "⌁",
                        bless: "✧",
                        mark: "◎",
                      })[s.kind],
                  )
                  .join("")}
              </text>
            )}
            {result && impacted && result.hpBefore !== result.hpAfter && (
              <text
                className={`combat-float vfx-damage ${result.hpAfter > result.hpBefore ? "healing" : ""}`}
                x="0"
                y={-0.45 - (reduced ? 0 : phase(progress, impact, 1) * 0.35)}
                opacity={progress > 0.94 ? (1 - progress) / 0.06 : 1}
                textAnchor="middle"
              >
                {result.hpAfter > result.hpBefore ? "+" : ""}
                {result.hpAfter - result.hpBefore}
              </text>
            )}
          </g>
        );
      })}
      {event && actor && (
        <SpellEffects
          event={event}
          g={g}
          progress={reduced ? (impacted ? 0.75 : 0.1) : progress}
          reduced={reduced}
        />
      )}
    </svg>
  );
}
