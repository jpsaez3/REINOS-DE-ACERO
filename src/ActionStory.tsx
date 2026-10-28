import { abilities } from "./content";
import { zone, type CombatEvent } from "./combat-events";
const labels: Record<string, string> = {
  guard: "Protección",
  rage: "Furia",
  slow: "Ralentizado",
  root: "Inmovilizado",
  bless: "Bendecido",
  mark: "Expuesto",
};
export function ActionStory({
  event,
  playing = false,
  outcomeVisible = true,
}: {
  event: CombatEvent;
  playing?: boolean;
  outcomeVisible?: boolean;
}) {
  const miss = event.details.some((s) => s.includes(": fallo"));
  const critical = event.details.some((s) => s.includes("CRÍTICO"));
  return (
    <section
      className={`action-story ${event.team}`}
      aria-label="Detalle de la acción"
      aria-live="polite"
    >
      <div className="story-kicker">
        <span>
          {playing ? "EN CURSO" : "ÚLTIMA ACCIÓN"} ·{" "}
          {event.team === "enemy" ? "RIVAL" : "AVENTURERO"}
        </span>
        <span>RONDA {event.round}</span>
      </div>
      <h2>
        <strong>{event.actorName}</strong>
        <span>
          {event.kind === "move"
            ? "se desplaza"
            : event.kind === "wait"
              ? "mantiene la posición"
              : event.name}
        </span>
      </h2>
      {event.targetName && (
        <p className="story-target">
          {event.actorId === event.targetId
            ? "Sobre sí mismo"
            : `Objetivo: ${event.targetName}`}{" "}
          {outcomeVisible && miss && <b className="miss">FALLO</b>}
          {outcomeVisible && critical && <b>CRÍTICO</b>}
        </p>
      )}
      {event.kind === "move" ? (
        <p>
          Avanza {event.path.length} pasos desde el {zone(event.from)} hasta el{" "}
          {zone(event.to)}. Consume {event.costs.movement} de movimiento.
        </p>
      ) : event.abilityId ? (
        <p>{abilities[event.abilityId]?.description}</p>
      ) : (
        <p>
          No dispone de un objetivo o habilidad válidos en su posición actual.
        </p>
      )}
      {!outcomeVisible && (
        <p className="resolving-action">
          {event.kind === "move"
            ? "Recorriendo el camino…"
            : "Preparación y ejecución…"}
        </p>
      )}
      {outcomeVisible && !!event.effects.length && (
        <div className="story-effects">
          {event.effects.map((e) => (
            <div key={e.id}>
              <strong>{e.name}</strong>
              <span>
                {e.hpBefore !== e.hpAfter
                  ? `${e.hpAfter - e.hpBefore > 0 ? "+" : ""}${e.hpAfter - e.hpBefore} PV · ${e.hpBefore} → ${e.hpAfter}`
                  : "Sin pérdida de vida"}
                {e.hpAfter === 0 ? " · CAÍDO" : ""}
              </span>
              {e.statuses.map((s) => (
                <small key={s.kind}>
                  {labels[s.kind]} · {s.turns} finales de turno pendientes
                </small>
              ))}
            </div>
          ))}
        </div>
      )}
      {event.kind === "ability" && (
        <div className="story-cost">
          Coste real: {event.costs.action} acción principal
          {event.costs.bonus ? ` · ${event.costs.bonus} adicional` : ""} ·{" "}
          {event.costs.resources} recurso(s)
        </div>
      )}
      {outcomeVisible && (
        <details className="story-details">
          <summary>Ver tiradas y resolución completa</summary>
          <ol>
            {event.details.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
