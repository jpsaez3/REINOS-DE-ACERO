import { useId } from "react";
import type { Class, Race } from "./content";
import type { ActionEffect } from "./animation";
import { characterArt } from "./character-art";
/** Painted cut-out rig: each limb uses the corresponding part of the same
 * illustration, so the idle pose reconstructs the original without duplicates. */
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
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, ""),
    art = characterArt(race, cls),
    b = art.body;
  const robe = cls === "Mago" || cls === "Clérigo",
    hip = robe ? 103 : 83;
  const stride = walking ? Math.sin(walk * Math.PI * 2) * 13 : 0,
    bob = walking ? Math.abs(Math.sin(walk * Math.PI * 2)) * 1.2 : 0;
  const shield = action === "shield" || action === "bash";
  const leftWeapon = cls === "Guerrero" || cls === "Bárbaro";
  const right = walking
    ? -stride * 0.12
    : shield
      ? -gesture * 12
      : leftWeapon
        ? gesture * 3
        : -gesture * 10;
  const left = walking
    ? stride * 0.12
    : shield
      ? 0
      : cls === "Guerrero"
        ? -gesture * 16
        : cls === "Bárbaro"
          ? gesture * 14
          : gesture * 3;
  const small = race === "Enano" || race === "Mediano";
  const source = (
    <svg
      x="0"
      y="0"
      width="100"
      height="125"
      viewBox={`${b.x} ${b.y} ${b.width} ${b.height}`}
      preserveAspectRatio="none"
    >
      <image
        className="painted-sprite-image"
        href={art.src}
        width={art.sheetWidth}
        height={art.sheetHeight}
      />
    </svg>
  );
  return (
    <g
      className="miniature painted-miniature"
      data-art-key={art.key}
      data-class={cls}
      data-race={race}
      data-walking={walking}
      data-stride={stride.toFixed(2)}
      transform={`translate(${hit * Math.sin(hit * 18) * 2},${-bob}) rotate(${fallen * 75 + (walking ? Math.sin(walk * Math.PI * 2) * 0.6 : gesture * 1.5)},50,115)`}
    >
      <defs>
        <g id={`${id}-source`}>{source}</g>
        <clipPath id={`${id}-left-leg`}>
          <rect x="28" y={hip} width="22" height={125 - hip} />
        </clipPath>
        <clipPath id={`${id}-right-leg`}>
          <rect x="50" y={hip} width="22" height={125 - hip} />
        </clipPath>
        <mask
          id={`${id}-body`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="125"
        >
          <rect width="100" height="125" fill="white" />
          <rect x="28" y={hip} width="44" height={125 - hip} fill="black" />
          <rect x="0" y="0" width="32" height="125" fill="black" />
          <rect x="68" y="0" width="32" height="125" fill="black" />
        </mask>
        <clipPath id={`${id}-left-arm`}>
          <path d={`M0 0 H32 V${hip} H28 V125 H0Z`} />
        </clipPath>
        <clipPath id={`${id}-right-arm`}>
          <path d={`M68 0 H100 V125 H72 V${hip} H68Z`} />
        </clipPath>
      </defs>
      <g
        transform={`translate(${facing < 0 ? 100 : 0},0) scale(${facing < 0 ? -1 : 1},1)`}
      >
        <g transform={small ? "translate(6,26) scale(.88,.78)" : ""}>
          <g
            className="mini-leg left"
            transform={`rotate(${stride},40,${hip})`}
          >
            <use href={`#${id}-source`} clipPath={`url(#${id}-left-leg)`} />
          </g>
          <g
            className="mini-leg right"
            transform={`rotate(${-stride},60,${hip})`}
          >
            <use href={`#${id}-source`} clipPath={`url(#${id}-right-leg)`} />
          </g>
          <use href={`#${id}-source`} mask={`url(#${id}-body)`} />
          <g className="shield-arm" transform={`rotate(${left},30,36)`}>
            <use href={`#${id}-source`} clipPath={`url(#${id}-left-arm)`} />
          </g>
          <g
            className="mini-arm weapon-arm"
            data-gesture={gesture.toFixed(2)}
            transform={`rotate(${right},70,36)`}
          >
            <use href={`#${id}-source`} clipPath={`url(#${id}-right-arm)`} />
            {action === "potion" && (
              <g className="held-potion" transform="translate(72,62)">
                <path
                  d="M-2 -8 H2 V-4 Q8 4 0 6 Q-8 4 -2 -4Z"
                  fill="#a5d5be"
                  stroke="#ece2bb"
                  strokeWidth="1"
                />
                <path d="M-4 0 Q0 -2 4 0 V3 Q0 6 -4 3Z" fill="#4c9b75" />
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
}
