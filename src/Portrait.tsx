import type { Class, Race } from "./content";
import { characterArt, portraitFrame } from "./character-art";
export function Portrait({
  race,
  cls,
  large = false,
  enemy = false,
}: {
  race: Race;
  cls: Class;
  large?: boolean;
  enemy?: boolean;
}) {
  const art = characterArt(race, cls),
    b = portraitFrame(race, cls, large);
  return (
    <span
      role="img"
      aria-label={`${race} · ${cls}`}
      title={`${race} · ${cls}`}
      data-art-key={art.key}
      data-race={race}
      data-class={cls}
      className={`portrait painted-portrait ${large ? "large" : ""} ${enemy ? "foe" : ""}`}
    >
      <svg
        viewBox={`${b.x} ${b.y} ${b.width} ${b.height}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <image href={art.src} width={art.sheetWidth} height={art.sheetHeight} />
      </svg>
    </span>
  );
}
