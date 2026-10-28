import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  attributes,
  races,
  classes,
  classSkills,
  abilities,
  defaultStats,
  pointCost,
  type Class,
  type Race,
  type Stats,
} from "./content";
import {
  active,
  aiTurn,
  board,
  canUse,
  createUnit,
  defense,
  distance,
  lineOfSight,
  hitChance,
  enemyIntent,
  endTurn,
  has,
  load,
  mod,
  move,
  newGame,
  reachable,
  save,
  use,
  type Game,
  type Unit,
} from "./engine";
import "./style.css";
const KEY = "reinos-acero-v1";
const statusNames: Record<string, string> = {
  guard: "Protección",
  rage: "Furia",
  slow: "Ralentizado",
  root: "Inmovilizado",
  bless: "Bendecido",
  mark: "Expuesto",
};
const hasSaved = () => {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
};
const symbols: Record<Class, string> = {
  Guerrero: "♜",
  Bárbaro: "⚒",
  Pícaro: "♟",
  Mago: "✦",
  Clérigo: "✚",
  Explorador: "➶",
};
const portraitCells: Record<Class, [number, number]> = {
  Guerrero: [0, 0],
  Bárbaro: [1, 0],
  Pícaro: [2, 0],
  Mago: [0, 1],
  Clérigo: [1, 1],
  Explorador: [2, 1],
};
function Portrait({
  cls,
  large = false,
  enemy = false,
}: {
  cls: Class;
  large?: boolean;
  enemy?: boolean;
}) {
  const [x, y] = portraitCells[cls];
  return (
    <span
      aria-hidden="true"
      className={`portrait ${large ? "large" : ""} ${enemy ? "foe" : ""}`}
      style={{ backgroundPosition: `${x * 50}% ${y * (large ? 100 : 75)}%` }}
    />
  );
}
type Draft = { name: string; race: Race; cls: Class; stats: Stats };
const initial: Draft[] = (
  ["Guerrero", "Pícaro", "Mago", "Clérigo"] as Class[]
).map((cls, i) => ({
  name: ["Aldara", "Nim", "Borin", "Sarya"][i],
  race: (["Elfo", "Mediano", "Enano", "Humano"] as Race[])[i],
  cls,
  stats: defaultStats(cls),
}));
function App() {
  const [screen, setScreen] = useState("menu"),
    [draft, setDraft] = useState(initial),
    [g, setG] = useState<Game | null>(null),
    [chosen, setChosen] = useState("attack"),
    [inspect, setInspect] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [help, setHelp] = useState(false),
    [fast, setFast] = useState(false),
    [saved, setSaved] = useState(hasSaved);
  const [hovered, setHovered] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { id: string; delta: number; key: number }[]
  >([]);
  const previous = useRef<Game | null>(null);
  useEffect(() => {
    if (g && previous.current) {
      const old = previous.current;
      setFeedback(
        g.units.flatMap((u) => {
          const before = old.units.find((v) => v.id === u.id);
          return before && before.hp !== u.hp
            ? [
                {
                  id: u.id,
                  delta: u.hp - before.hp,
                  key: g.seed + g.log.length,
                },
              ]
            : [];
        }),
      );
    }
    previous.current = g;
    const timer = setTimeout(() => setFeedback([]), 1000);
    return () => clearTimeout(timer);
  }, [g]);
  const actor = g ? active(g) : null,
    player = actor?.team === "party" && g?.result === "playing";
  const change = (fn: (next: Game) => void) => {
    if (!g) return;
    const next = structuredClone(g);
    fn(next);
    setG(next);
  };
  useEffect(() => {
    if (!g) return;
    try {
      localStorage.setItem(KEY, save(g));
      setSaved(true);
    } catch {
      setMessage("No se pudo guardar: almacenamiento local no disponible.");
    }
    if (g.result === "playing" && active(g).team === "enemy") {
      const timer = setTimeout(
        () => {
          setG((old) => {
            if (!old || active(old).team !== "enemy") return old;
            const next = structuredClone(old);
            aiTurn(next);
            return next;
          });
          setChosen("attack");
        },
        fast ? 50 : 650,
      );
      return () => clearTimeout(timer);
    }
  }, [g, fast]);
  function start() {
    const party = draft.map((d, i) =>
      createUnit(
        "p" + i,
        d.name.trim() || "Aventurero " + (i + 1),
        d.race,
        d.cls,
        d.stats,
        2,
        i + 2,
      ),
    );
    setG(newGame(party));
    setChosen("attack");
    setScreen("combat");
    setMessage("");
  }
  function resume() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) throw Error("No hay partida guardada");
      setG(load(raw));
      setChosen("attack");
      setScreen("combat");
      setMessage("");
    } catch (e) {
      setMessage(String(e));
    }
  }
  const edit = (i: number, patch: Partial<Draft>) =>
    setDraft((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  function target(u: Unit) {
    if (!g || !player) return;
    const error = canUse(g, chosen, u);
    if (error) {
      setMessage(error);
      return;
    }
    change((n) => use(n, chosen, u.id));
    setMessage("");
  }
  const destinations = g && actor && player ? reachable(g, actor) : new Map();
  const viewed = g?.units.find((u) => u.id === inspect);
  const hoverTarget = g?.units.find((u) => u.id === hovered && u.hp > 0);
  const hoveredAbility = abilities[chosen];
  const areaTarget =
    g &&
    hoverTarget &&
    player &&
    !canUse(g, chosen, hoverTarget) &&
    ["slow", "area"].includes(hoveredAbility.effect)
      ? hoverTarget
      : null;
  return (
    <>
      <header>
        <a onClick={() => setScreen("menu")}>
          R<span>✦</span>A
        </a>
        <div>
          <strong>REINOS DE ACERO</strong>
          <small>CRÓNICAS DEL PASO CENIZA</small>
        </div>
        <nav>
          <button onClick={() => setHelp(!help)}>Reglas rápidas</button>
          {screen === "combat" && (
            <button onClick={() => setScreen("menu")}>Menú</button>
          )}
        </nav>
      </header>
      {message && (
        <div role="alert" className="notice" onClick={() => setMessage("")}>
          {message} <span>×</span>
        </div>
      )}
      {help && (
        <aside className="help">
          <button onClick={() => setHelp(false)}>Cerrar</button>
          <h2>Antes de cruzar el paso</h2>
          <p>
            Selecciona una habilidad y pulsa un objetivo. Las casillas verdes
            indican destinos alcanzables: pulsa para moverte. Puedes mover antes
            o después de tu acción. Solo actúa el personaje resaltado en
            iniciativa.
          </p>
          <p>
            ♜ Pared: bloquea movimiento y visión. ▧ Cobertura: bloquea
            movimiento y da +2 defensa contra ataques lejanos a quien esté junto
            a ella. ♨ Brasas: 3 de daño por entrada. Las fichas caídas no
            bloquean el paso.
          </p>
          <p>
            Una acción por turno. Guerrero: protege y retiene enemigos próximos.
            Explorador: inmoviliza para el golpe del pícaro. Clérigo: cura y
            suma defensa. Mago: ralentiza grupos. Furia habilita una poción
            adicional. Dracónidos: aliento una vez.
          </p>
          <p>
            1 natural falla; 20 crítico duplica el dado del arma. Distancias
            ortogonales. Ganas al abatir a los tres enemigos; pierdes si caen
            los cuatro héroes. El guardado es automático tras cada cambio.
          </p>
        </aside>
      )}
      {screen === "menu" && (
        <main className="menu">
          <div className="eyebrow">UNA AVENTURA TÁCTICA · CAPÍTULO I</div>
          <h1>
            El acero decide.
            <br />
            <em>Tú eliges cómo.</em>
          </h1>
          <p>
            Cuatro aventureros. Un paso en ruinas.
            <br />
            Haz de cada posición una ventaja.
          </p>
          <div className="menu-actions">
            <button className="primary" onClick={() => setScreen("create")}>
              Nueva partida <span>→</span>
            </button>
            <button disabled={!saved} onClick={resume}>
              Continuar expedición
            </button>
            <button onClick={() => setScreen("settings")}>Configuración</button>
          </div>
          <div className="menu-seal">
            <span>UNA NUEVA EXPEDICIÓN</span>
            <strong>El Paso Ceniza</strong>
            <p>
              Ruinas antiguas. Enemigos al acecho.
              <br />
              Cuatro destinos que escribir.
            </p>
          </div>
          <footer>
            01 / EL PASO CENIZA <span>ESTRATEGIA POR TURNOS · UN JUGADOR</span>
          </footer>
        </main>
      )}
      {screen === "settings" && (
        <main>
          <h1>Configuración</h1>
          <label>
            <input
              type="checkbox"
              checked={fast}
              onChange={(e) => setFast(e.target.checked)}
            />{" "}
            Turnos enemigos rápidos
          </label>
          <p>
            La partida se guarda en este navegador. Una nueva expedición
            sustituirá el guardado cuando comience el combate.
          </p>
          <button onClick={() => setScreen("menu")}>Volver</button>
        </main>
      )}
      {screen === "create" && (
        <main>
          <div className="eyebrow">PREPARA TU EXPEDICIÓN</div>
          <h1>Cuatro destinos. Una alianza.</h1>
          <p>
            Raza y clase son independientes. Distribuye hasta 27 puntos: valores
            8–13 cuestan 1; 14 y 15 cuestan 2 cada uno.
          </p>
          <div className="creation">
            {draft.map((d, i) => (
              <section className="card" key={i}>
                <div className="eyebrow">
                  AVENTURERO 0{i + 1} <span>{symbols[d.cls]}</span>
                </div>
                <Portrait cls={d.cls} large />
                <label>
                  Nombre
                  <input
                    maxLength={30}
                    value={d.name}
                    onChange={(e) => edit(i, { name: e.target.value })}
                  />
                </label>
                <label>
                  Raza
                  <select
                    aria-label="Raza"
                    value={d.race}
                    onChange={(e) => edit(i, { race: e.target.value as Race })}
                  >
                    {Object.keys(races).map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <p className="hint">{races[d.race]}</p>
                <label>
                  Clase
                  <select
                    aria-label="Clase"
                    value={d.cls}
                    onChange={(e) => {
                      const cls = e.target.value as Class;
                      edit(i, { cls, stats: defaultStats(cls) });
                    }}
                  >
                    {Object.keys(classes).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <p className="hint">{classes[d.cls].desc}</p>
                <div className="stats">
                  {attributes.map((a) => (
                    <label
                      key={a}
                      title={`${a}: modificador ${mod(d.stats[a]) >= 0 ? "+" : ""}${mod(d.stats[a])}. ${a === "Constitución" ? "Aumenta vida." : a === "Destreza" ? "Iniciativa y armas ágiles." : a === classes[d.cls].stat ? "Atributo de ataque de tu clase." : "Disponible para ampliar habilidades futuras."}`}
                    >
                      {a}
                      <input
                        aria-label={`${a} ${i + 1}`}
                        type="number"
                        min={8}
                        max={15}
                        value={d.stats[a]}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isInteger(v) && v >= 8 && v <= 15)
                            edit(i, { stats: { ...d.stats, [a]: v } });
                        }}
                      />
                    </label>
                  ))}
                </div>
                <strong className={pointCost(d.stats) > 27 ? "bad" : ""}>
                  Puntos: {pointCost(d.stats)} / 27
                </strong>
                <p>
                  PV{" "}
                  {classes[d.cls].hp +
                    mod(d.stats.Constitución) * 2 +
                    (d.race === "Enano" ? 3 : 0)}{" "}
                  · Defensa{" "}
                  {classes[d.cls].def + (d.race === "Mediano" ? 1 : 0)} ·
                  Movimiento {classes[d.cls].move + (d.race === "Elfo" ? 1 : 0)}
                </p>
              </section>
            ))}
          </div>
          <button onClick={() => setScreen("menu")}>Volver</button>{" "}
          <button
            className="primary"
            disabled={draft.some((d) => pointCost(d.stats) > 27)}
            onClick={start}
          >
            Entrar en el Paso Ceniza →
          </button>
        </main>
      )}
      {screen === "combat" && g && actor && (
        <main className="battle">
          <div className="battle-heading">
            <div>
              <div className="eyebrow">ENCUENTRO 01 · RONDA {g.round}</div>
              <h1>El Paso Ceniza</h1>
            </div>
            <div className="objective">
              OBJETIVO <strong>Derrota a los guardianes del paso</strong>
            </div>
          </div>
          <div className="initiative" aria-label="Orden de iniciativa">
            {g.order.map((id) => {
              const u = g.units.find((v) => v.id === id)!;
              return (
                <button
                  key={id}
                  className={`${actor.id === id ? "current" : ""} ${u.hp <= 0 ? "dead" : ""} ${u.team}`}
                  onClick={() => setInspect(id)}
                >
                  <Portrait cls={u.cls} enemy={u.team === "enemy"} />
                  {u.name}
                  <small>
                    {u.initiative} INI · {u.hp} PV
                  </small>
                </button>
              );
            })}
          </div>
          <div className="battle-layout">
            <section className="map-panel">
              <div className="map-bar">
                <span>RUINAS DE LA FRONTERA</span>
                <span>▧ COBERTURA &nbsp; ♨ PELIGRO</span>
              </div>
              <div className="action-ribbon" aria-live="polite" key={g.seed}>
                {g.log
                  .slice()
                  .reverse()
                  .find((s) => /CRÍTICO|fallo|usa /.test(s)) ??
                  "Observa el terreno y prepara tu primera jugada."}
              </div>
              <div className="board" role="grid" aria-label="Tablero táctico">
                {board.flatMap((row, y) =>
                  [...row].map((t, x) => {
                    const u = g.units.find(
                        (u) => u.x === x && u.y === y && u.hp > 0,
                      ),
                      canMove = player && destinations.has(`${x},${y}`) && !u;
                    const validTarget = !!u && player && !canUse(g, chosen, u);
                    const inArea =
                      areaTarget &&
                      distance({ x, y }, areaTarget) <=
                        (hoveredAbility.radius ?? 1) &&
                      lineOfSight(areaTarget, { x, y }) &&
                      t !== "#";
                    const effect = u
                      ? feedback.find((f) => f.id === u.id)
                      : null;
                    return (
                      <button
                        role="gridcell"
                        aria-label={`${x},${y}${u ? " " + u.name : ""}`}
                        key={`${x},${y}`}
                        className={`tile ${t === "#" ? "wall" : t === "c" ? "cover" : t === "!" ? "hazard" : ""} ${canMove ? "reachable" : ""} ${u ? u.team : ""} ${u?.id === actor.id ? "selected" : ""} ${validTarget ? "valid-target" : ""} ${inArea ? "area-preview" : ""} ${effect ? (effect.delta < 0 ? "struck" : "restored") : ""}`}
                        title={
                          u
                            ? `${u.name} · ${u.hp}/${u.maxHp} PV · defensa ${defense(g, u, actor)}${canUse(g, chosen, u) ? " · " + canUse(g, chosen, u) : " · objetivo válido"}`
                            : t === "#"
                              ? "Pared: bloquea visión y movimiento"
                              : t === "c"
                                ? "Cobertura: +2 defensa a distancia a adyacentes"
                                : t === "!"
                                  ? "Brasas: 3 daño al entrar"
                                  : `Casilla ${x},${y}`
                        }
                        onMouseEnter={() => setHovered(u?.id ?? null)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(u?.id ?? null)}
                        onBlur={() => setHovered(null)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (u) setInspect(u.id);
                        }}
                        onClick={() => {
                          if (u) {
                            if (player) target(u);
                            else setInspect(u.id);
                          } else if (canMove) {
                            change((n) => move(n, { x, y }));
                            setMessage("");
                          }
                        }}
                      >
                        {u ? (
                          <>
                            <Portrait cls={u.cls} enemy={u.team === "enemy"} />
                            {effect && (
                              <span
                                key={effect.key}
                                className={`combat-float ${effect.delta > 0 ? "healing" : ""}`}
                              >
                                {effect.delta > 0 ? "+" : ""}
                                {effect.delta}
                              </span>
                            )}
                            {!!u.statuses.length && (
                              <span
                                className="status-pips"
                                title={u.statuses
                                  .map((st) => statusNames[st.kind])
                                  .join(", ")}
                              >
                                {u.statuses
                                  .map(
                                    (st) =>
                                      ({
                                        guard: "◇",
                                        rage: "↑",
                                        slow: "❄",
                                        root: "⌁",
                                        bless: "✧",
                                        mark: "◎",
                                      })[st.kind],
                                  )
                                  .join("")}
                              </span>
                            )}
                            <small>{u.name.split(" ")[0]}</small>
                            <i
                              style={{ width: `${(100 * u.hp) / u.maxHp}%` }}
                            />
                          </>
                        ) : t === "#" ? (
                          ""
                        ) : t === "c" ? (
                          "▧"
                        ) : t === "!" ? (
                          "♨"
                        ) : (
                          ""
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
              <div className="map-bar">
                <span>Click: mover / objetivo · Click derecho: ficha</span>
                <span>VERDE: ALCANCE DE MOVIMIENTO</span>
              </div>
            </section>
            <aside className="sidebar">
              <section className="card actor">
                <div className="eyebrow">
                  {player ? "TU TURNO" : "TURNO ENEMIGO"}
                </div>
                <div className="actor-heading">
                  <Portrait cls={actor.cls} enemy={actor.team === "enemy"} />
                  <h2>{actor.name}</h2>
                </div>
                <p>
                  {actor.race} · {actor.cls} · Nivel {actor.level}
                </p>
                <progress value={actor.hp} max={actor.maxHp} />
                <p>
                  {actor.hp} / {actor.maxHp} PV
                </p>
                <div className="meters">
                  <span>
                    <b>{actor.move}</b> Movimiento
                  </span>
                  <span>
                    <b>{actor.action}</b> Acción
                  </span>
                  <span>
                    <b>{actor.resource}</b> Recursos
                  </span>
                </div>
                <p className="hint">
                  {actor.statuses
                    .map((s) => `${statusNames[s.kind]} (${s.turns})`)
                    .join(" · ") || "Sin estados alterados"}
                </p>
                <div className="actions">
                  {[
                    "attack",
                    ...classSkills(actor.cls),
                    ...(actor.race === "Dracónido" ? ["breath"] : []),
                    "potion",
                  ].map((id) => (
                    <button
                      disabled={!player}
                      className={chosen === id ? "active" : ""}
                      key={id}
                      title={`${abilities[id].description} Coste: ${abilities[id].cost} recurso(s). ${abilities[id].condition}`}
                      onClick={() => {
                        setChosen(id);
                        setMessage("");
                        if (abilities[id].target === "self") {
                          const err = canUse(g, id, actor);
                          if (err) setMessage(err);
                          else change((n) => use(n, id, actor.id));
                        }
                      }}
                    >
                      {abilities[id].name}
                      <small>
                        {id === "potion"
                          ? `${actor.potion} disponible`
                          : `${abilities[id].cost} recurso · ${id === "attack" ? classes[actor.cls].range : abilities[id].range} alcance`}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="hint chosen-description">
                  {abilities[chosen].description}
                </p>
                {hoverTarget && (
                  <div className="target-preview" role="status">
                    <strong>{hoverTarget.name}</strong>
                    <span>
                      {hoverTarget.hp}/{hoverTarget.maxHp} PV · Defensa{" "}
                      {defense(g, hoverTarget, actor)}
                    </span>
                    <b>
                      {hitChance(g, chosen, hoverTarget) === null
                        ? canUse(g, chosen, hoverTarget)
                        : `${hitChance(g, chosen, hoverTarget)}% ${["damage", "root"].includes(abilities[chosen].effect) ? "de impacto (sin suerte racial)" : "efecto directo"}`}
                    </b>
                  </div>
                )}
                <button
                  className="primary end"
                  disabled={!player}
                  onClick={() => {
                    change(endTurn);
                    setChosen("attack");
                  }}
                >
                  Finalizar turno →
                </button>
                <button onClick={() => setInspect(actor.id)}>
                  Consultar ficha
                </button>
              </section>
              <section className="card intentions">
                <div className="eyebrow">LEE EL CAMPO DE BATALLA</div>
                {g.units
                  .filter((u) => u.team === "enemy" && u.hp > 0)
                  .map((u) => (
                    <div key={u.id}>
                      <Portrait cls={u.cls} enemy />
                      <p>
                        <strong>{u.name}</strong>
                        <small>{enemyIntent(g, u)}</small>
                      </p>
                    </div>
                  ))}
                <p className="hint">
                  Previsión orientativa: los enemigos reconsideran su objetivo
                  al moverse.
                </p>
              </section>
              <section className="card log">
                <div className="eyebrow">REGISTRO DE COMBATE</div>
                <div role="log">
                  {g.log
                    .slice(-20)
                    .reverse()
                    .map((s, i) => (
                      <p key={g.log.length - i}>{s}</p>
                    ))}
                </div>
              </section>
            </aside>
          </div>
          {g.result !== "playing" && (
            <div className="overlay">
              <section className="modal">
                <div className="eyebrow">EXPEDICIÓN CONCLUIDA</div>
                <h1>
                  {g.result === "victory"
                    ? "El paso es vuestro."
                    : "El acero ha caído."}
                </h1>
                <p>
                  {g.result === "victory"
                    ? "Victoria. Cada aventurero recibe 100 PX y +4 PV al alcanzar nivel 2."
                    : "Derrota. Prueba otra composición y utiliza las coberturas para proteger al grupo."}
                </p>
                <button className="primary" onClick={() => setScreen("create")}>
                  Preparar otra expedición
                </button>
                <button onClick={() => setScreen("menu")}>
                  Menú principal
                </button>
              </section>
            </div>
          )}
        </main>
      )}
      {viewed && (
        <div className="overlay">
          <section className="modal sheet">
            <button className="close" onClick={() => setInspect(null)}>
              Cerrar ×
            </button>
            <div className="eyebrow">FICHA DE PERSONAJE</div>
            <Portrait cls={viewed.cls} large enemy={viewed.team === "enemy"} />
            <h1>
              {symbols[viewed.cls]} {viewed.name}
            </h1>
            <p>
              {viewed.race} · {viewed.cls} · Nivel {viewed.level} · {viewed.xp}{" "}
              PX
            </p>
            <p>{races[viewed.race]}</p>
            <div className="sheet-stats">
              {attributes.map((a) => (
                <span key={a}>
                  {a}
                  <b>
                    {viewed.stats[a]} ({mod(viewed.stats[a]) >= 0 ? "+" : ""}
                    {mod(viewed.stats[a])})
                  </b>
                </span>
              ))}
            </div>
            <p>
              Vida {viewed.hp}/{viewed.maxHp} · Defensa base {viewed.def} ·
              Iniciativa {viewed.initiative}
            </p>
            <h3>Equipo e inventario</h3>
            <p>{viewed.equipment}</p>
            <p>{viewed.inventory.join(", ") || "Sin consumibles"}</p>
            <h3>{abilities[classes[viewed.cls].skill].name}</h3>
            <p>{abilities[classes[viewed.cls].skill].description}</p>
            <h3>{abilities[classSkills(viewed.cls)[1]].name}</h3>
            <p>{abilities[classSkills(viewed.cls)[1]].description}</p>
            <p>
              Recursos: {viewed.resource} · Reacciones: {viewed.reaction} ·
              Acción adicional: {viewed.bonus}
            </p>
            <p>
              Estados:{" "}
              {viewed.statuses
                .map((s) => `${statusNames[s.kind]}: ${s.turns} turnos`)
                .join(", ") || "ninguno"}
            </p>
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
