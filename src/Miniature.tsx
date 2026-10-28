import type { Class, Race } from "./content";
import type { ActionEffect } from "./animation";
export function Miniature({
  cls,
  race,
  walk = 0,
  walking = false,
  gesture = 0,
  facing = 1,
  hit = 0,
  fallen = 0,
  action = "wait",
}: {
  cls: Class;
  race: Race;
  walk?: number;
  walking?: boolean;
  gesture?: number;
  facing?: number;
  hit?: number;
  fallen?: number;
  action?: ActionEffect;
}) {
  const cloth: Record<Class, string> = {
    Guerrero: "#697e88",
    Bárbaro: "#8a5940",
    Pícaro: "#455345",
    Mago: "#3b6485",
    Clérigo: "#ddcda1",
    Explorador: "#55754a",
  };
  const skin =
    race === "Orco"
      ? "#8e9e66"
      : race === "Dracónido"
        ? "#b68749"
        : race === "Enano"
          ? "#d4a276"
          : "#ddb08b";
  const stride = walking ? Math.sin(walk * Math.PI * 2) * 24 : 0,
    bob = walking ? Math.abs(Math.sin(walk * Math.PI * 2)) * 2.5 : 0;
  const dwarf = race === "Enano",
    small = dwarf || race === "Mediano",
    robe = cls === "Mago" || cls === "Clérigo";
  const shieldPose = action === "shield" || action === "bash";
  const weaponGesture = shieldPose || action === "breath" ? 0 : gesture;
  const arm = -weaponGesture * 55 - stride * 0.65;
  return (
    <g
      className="miniature"
      data-class={cls}
      data-race={race}
      data-walking={walking}
      data-stride={stride.toFixed(2)}
      transform={`translate(${hit * Math.sin(hit * 25) * 5},${-bob}) rotate(${fallen * 75},50,100)`}
    >
      <g
        transform={`translate(${facing < 0 ? 100 : 0},0) scale(${facing < 0 ? -1 : 1},1)`}
      >
        <g transform={small ? "translate(6,22) scale(.88,.78)" : ""}>
          <g className="mini-leg left" transform={`rotate(${stride},41,78)`}>
            <path
              d="M33 77 Q34 94 33 109 L46 109 L47 78Z"
              fill="#39362e"
              stroke="#221f19"
              strokeWidth="2"
            />
            <path
              d="M32 102 L46 102 L48 115 Q36 120 27 114Z"
              fill="#41372b"
              stroke="#1b201a"
              strokeWidth="2"
            />
            <path d="M34 106 L45 106" stroke="#b29c6e" strokeWidth="2" />
          </g>
          <g className="mini-leg right" transform={`rotate(${-stride},57,78)`}>
            <path
              d="M50 77 L64 78 L64 109 L52 110Z"
              fill="#484032"
              stroke="#221f19"
              strokeWidth="2"
            />
            <path
              d="M52 103 L65 102 L72 113 Q63 120 51 115Z"
              fill="#51432e"
              stroke="#1b201a"
              strokeWidth="2"
            />
            <path d="M55 106 L64 106" stroke="#b29c6e" strokeWidth="2" />
          </g>
          <path
            d="M29 37 Q17 56 20 89 L37 103 L58 97 L74 94 Q73 60 67 36Z"
            fill={cloth[cls]}
            stroke="#202b27"
            strokeWidth="2"
          />
          <path d="M28 45 L23 89 L35 97 L39 54Z" fill="#0e251f" opacity=".48" />
          <path
            d={
              robe
                ? "M32 44 L22 100 Q47 111 73 99 L62 43Z"
                : "M31 40 Q47 35 65 40 L67 82 L31 82Z"
            }
            fill={cloth[cls]}
            stroke="#26352b"
            strokeWidth="2"
          />
          <path
            d="M35 42 Q46 40 51 42 L54 77 L39 78Z"
            fill="#f1dfb0"
            opacity=".16"
          />
          {["Guerrero", "Clérigo"].includes(cls) && (
            <g>
              <path
                d="M32 41 L45 36 L63 41 L62 65 L48 74 L34 65Z"
                fill={cls === "Guerrero" ? "#9aa9a6" : "#ded5af"}
                stroke="#3c514a"
                strokeWidth="2"
              />
              <path
                d="M47 42 L48 68 M35 56 L61 56"
                stroke="#f2db9b"
                strokeWidth="2"
              />
              <path
                d="M27 40 Q26 31 38 35 L40 47 L25 49Z M60 36 Q73 31 73 44 L62 49Z"
                fill="#879b92"
                stroke="#253b31"
                strokeWidth="2"
              />
            </g>
          )}
          {cls === "Bárbaro" && (
            <g>
              <path
                d="M30 39 Q49 32 65 40 L62 65 L34 66Z"
                fill={skin}
                stroke="#5f4b32"
                strokeWidth="2"
              />
              <path
                d="M27 39 L35 32 L41 39 L35 49 L23 47Z M60 38 L67 32 L76 41 L70 49Z"
                fill="#8e8060"
                stroke="#493e2c"
                strokeWidth="2"
              />
              <path
                d="M34 43 L61 62 M55 39 L38 66"
                stroke="#55472f"
                strokeWidth="5"
              />
            </g>
          )}
          <path
            d="M30 76 L66 75 L67 82 L30 83Z"
            fill="#3f3326"
            stroke="#1e2b22"
            strokeWidth="1.5"
          />
          <rect
            x="45"
            y="75"
            width="10"
            height="8"
            rx="1"
            fill="#d6b66e"
            stroke="#695833"
            strokeWidth="2"
          />
          {cls === "Mago" && (
            <g stroke="#d3bb73" fill="none" strokeWidth="1.6">
              <path d="M31 52 L29 94 M64 52 L69 96 M37 97 L48 101 L59 97" />
              <path d="M47 51 L52 58 L47 65 L42 58Z" />
            </g>
          )}
          {cls === "Clérigo" && (
            <g stroke="#b78b37" strokeWidth="2" fill="none">
              <circle cx="48" cy="55" r="7" />
              <path d="M48 43 V67 M36 55 H60 M40 47 L56 63 M56 47 L40 63" />
            </g>
          )}
          <g
            className="shield-arm"
            transform={`translate(${shieldPose ? gesture * 30 : 0},${shieldPose ? -gesture * 6 : 0}) rotate(${stride * 0.65 - (shieldPose ? gesture * 40 : 0)},29,45)`}
          >
            <path
              d="M29 43 Q19 48 19 63 L26 73 L33 66 L30 56Z"
              fill={cloth[cls]}
              stroke="#26352b"
              strokeWidth="2"
            />
            <ellipse
              cx="26"
              cy="70"
              rx="5"
              ry="6"
              fill={skin}
              stroke="#5a4d32"
              strokeWidth="1.5"
            />
            {cls === "Guerrero" && (
              <g>
                <path
                  d="M9 57 L23 51 L37 58 L34 78 L23 90 L12 80Z"
                  fill="#536e70"
                  stroke="#d2b16e"
                  strokeWidth="3"
                />
                <path
                  d="M23 57 V80 M14 67 H32"
                  stroke="#d4bb7d"
                  strokeWidth="2"
                />
              </g>
            )}
            {cls === "Pícaro" && (
              <path
                d="M21 68 L11 49 L14 44 L25 66Z"
                fill="#c5d0bd"
                stroke="#414e42"
                strokeWidth="1.5"
              />
            )}
          </g>
          <g
            className="mini-arm weapon-arm"
            data-gesture={gesture.toFixed(2)}
            transform={`rotate(${arm},64,44)`}
          >
            <path
              d="M64 42 Q74 43 73 59 L67 72 L59 66 L64 56Z"
              fill={cloth[cls]}
              stroke="#25352a"
              strokeWidth="2"
            />
            <ellipse
              cx="66"
              cy="69"
              rx="5"
              ry="6"
              fill={skin}
              stroke="#635333"
              strokeWidth="1.5"
            />
            {action === "potion" && (
              <path
                className="held-potion"
                d="M62 57 H69 V62 Q79 73 65 76 Q54 73 62 62Z"
                fill="#97d8ac"
                stroke="#ebefc5"
                strokeWidth="2"
              />
            )}
            <g
              className="held-weapon"
              opacity={action === "potion" ? 0 : 1}
              transform={`rotate(${weaponGesture * 120},66,69)`}
            >
              {cls === "Guerrero" && (
                <g>
                  <path
                    d="M69 64 L73 19 L77 10 L80 19 L74 64Z"
                    fill="#d7dfc6"
                    stroke="#41594b"
                    strokeWidth="1.7"
                  />
                  <path d="M64 62 L80 64" stroke="#d3b16c" strokeWidth="4" />
                  <path d="M69 66 L68 78" stroke="#4f3828" strokeWidth="4" />
                </g>
              )}
              {cls === "Bárbaro" && (
                <g>
                  <path d="M70 80 L76 16" stroke="#493d28" strokeWidth="5" />
                  <path
                    d="M74 16 Q58 10 56 26 L72 33 L83 31 Q94 24 87 13 L77 19"
                    fill="#b7c0aa"
                    stroke="#405043"
                    strokeWidth="2"
                  />
                </g>
              )}
              {cls === "Pícaro" && (
                <path
                  d="M67 68 L79 42 L81 34 L83 43 L72 70Z"
                  fill="#d4d9c0"
                  stroke="#4b5a46"
                  strokeWidth="2"
                />
              )}
              {cls === "Mago" && (
                <g>
                  <path d="M75 105 L77 11" stroke="#594a32" strokeWidth="5" />
                  <path
                    d="M77 5 L68 17 L77 29 L85 17Z"
                    fill="#9edfee"
                    stroke="#d6c079"
                    strokeWidth="2"
                  />
                  <path d="M77 8 L76 25" stroke="#e6fbff" strokeWidth="2" />
                </g>
              )}
              {cls === "Clérigo" && (
                <g>
                  <path d="M73 81 L77 31" stroke="#846f36" strokeWidth="5" />
                  <circle
                    cx="78"
                    cy="27"
                    r="10"
                    fill="#bda25c"
                    stroke="#ecda97"
                    strokeWidth="2"
                  />
                  <path
                    d="M78 13 V41 M64 27 H92"
                    stroke="#e1cd85"
                    strokeWidth="3"
                  />
                </g>
              )}
              {cls === "Explorador" && (
                <g>
                  <path
                    d="M80 29 Q104 66 79 101"
                    fill="none"
                    stroke="#b08a50"
                    strokeWidth="4"
                  />
                  <path
                    d={`M80 29 L${77 - gesture * 12} 65 L79 101`}
                    fill="none"
                    stroke="#e3d7ac"
                    strokeWidth="1.5"
                  />
                  <path d="M76 65 L101 62" stroke="#bda67c" strokeWidth="2" />
                </g>
              )}
            </g>
          </g>
          <path
            d="M34 25 Q33 10 49 9 Q64 8 65 24 L64 36 Q50 47 37 35Z"
            fill={skin}
            stroke="#5d5038"
            strokeWidth="2"
          />
          {(race === "Elfo" || race === "Orco" || race === "Dracónido") && (
            <path
              d="M36 23 L25 16 L32 32 L38 33 M64 23 L73 17 L69 32 L63 33"
              fill={skin}
              stroke="#685738"
              strokeWidth="1.4"
            />
          )}
          <path
            d="M33 23 Q29 3 48 4 Q66 2 67 23 L59 17 L55 12 Q42 21 33 23Z"
            fill={cls === "Mago" ? "#aa8a59" : "#4b3928"}
            stroke="#2b3022"
            strokeWidth="2"
          />
          <path
            d="M40 26 L45 27 M54 27 L59 26"
            stroke="#302c21"
            strokeWidth="2"
          />
          <path d="M48 29 L47 33 L51 33" stroke="#8a6d46" strokeWidth="1.5" />
          {dwarf && (
            <path
              d="M35 31 L44 35 L49 33 L54 35 L65 30 Q69 49 52 57 L43 52Z"
              fill="#9c703c"
              stroke="#5d482b"
              strokeWidth="2"
            />
          )}
          {race === "Orco" && (
            <path
              d="M39 33 L40 41 L44 35 M55 35 L59 42 L59 33"
              fill="#f0dfb0"
              stroke="#6e6d42"
            />
          )}
          {race === "Dracónido" && (
            <g>
              <path
                d="M39 30 L38 39 L58 40 L66 32 L61 27Z"
                fill="#c39854"
                stroke="#7c6235"
                strokeWidth="1.5"
              />
              <path
                d="M36 12 L31 0 L43 10 M57 10 L67 1 L65 18"
                fill="#b7a771"
                stroke="#5a5a35"
                strokeWidth="2"
              />
              <path
                d="M42 19 L48 15 L54 19"
                fill="none"
                stroke="#e0c07d"
                strokeWidth="2"
              />
            </g>
          )}
          {["Pícaro", "Explorador"].includes(cls) && (
            <path
              d="M30 28 Q24 3 47 1 Q69 0 70 29 L62 17 Q47 8 35 25Z"
              fill={cloth[cls]}
              stroke="#293d2b"
              strokeWidth="2"
            />
          )}
          <path
            d="M39 36 Q49 40 59 36"
            fill="none"
            stroke="#886d4c"
            strokeWidth="1.3"
          />
        </g>
      </g>
    </g>
  );
}
