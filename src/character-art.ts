import type { Class, Race } from "./content";
export const ART_CLASSES: Class[] = [
  "Guerrero",
  "Bárbaro",
  "Pícaro",
  "Mago",
  "Clérigo",
  "Explorador",
];
const raceFiles: Record<Race, string> = {
  Humano: "humano",
  Elfo: "elfo",
  Enano: "enano",
  Mediano: "mediano",
  Orco: "orco",
  Dracónido: "draconido",
};
// The painted sheets use close portrait rows and taller full-body rows. Bounds are
// measured on the delivered artwork, rather than assuming equal-sized cells.
const SHEET_WIDTH = 1086,
  SHEET_HEIGHT = 1448;
export interface ArtFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}
const rows: Record<Race, number[]> = {
  Humano: [0, 348, 674, 1038, 1440],
  Elfo: [0, 337, 661, 1031, 1435],
  Enano: [0, 344, 666, 1032, 1435],
  Mediano: [0, 326, 634, 1007, 1435],
  Orco: [0, 342, 648, 1027, 1438],
  Dracónido: [0, 314, 622, 991, 1430],
};
export function characterArt(race: Race, cls: Class) {
  const index = ART_CLASSES.indexOf(cls);
  if (index < 0 || !raceFiles[race])
    throw Error(`Arte no definido: ${race} / ${cls}`);
  const col = index % 3,
    row = Math.floor(index / 3),
    bounds = rows[race];
  const frame = (r: number): ArtFrame => ({
    x: (col * SHEET_WIDTH) / 3,
    y: bounds[r],
    width: SHEET_WIDTH / 3,
    height: bounds[r + 1] - bounds[r],
  });
  return {
    key: `${raceFiles[race]}-${index}`,
    src: `/art/characters/${raceFiles[race]}.png`,
    race,
    cls,
    portrait: frame(row),
    body: frame(row + 2),
    sheetWidth: SHEET_WIDTH,
    sheetHeight: SHEET_HEIGHT,
  };
}
export function portraitFrame(
  race: Race,
  cls: Class,
  large: boolean,
): ArtFrame {
  const b = characterArt(race, cls).portrait;
  return large
    ? b
    : {
        x: b.x + b.width * 0.12,
        y: b.y + b.height * 0.015,
        width: b.width * 0.76,
        height: b.height * 0.79,
      };
}
