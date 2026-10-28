export const attributes = [
  "Fuerza",
  "Destreza",
  "Constitución",
  "Inteligencia",
  "Sabiduría",
  "Carisma",
] as const;
export type Stats = Record<(typeof attributes)[number], number>;
export const races = {
  Humano:
    "Adaptabilidad: +1 recurso por encuentro; competencia en todas las armas básicas.",
  Elfo: "Paso élfico: +1 movimiento; los estados de ralentización duran un turno menos.",
  Enano:
    "Robustez: +3 vida; resistencia al veneno; +1 defensa junto a cobertura.",
  Mediano: "Suerte: repite el primer 1 natural de cada encuentro; +1 defensa.",
  Orco: "Tenacidad: sobrevive una vez con 1 PV a un golpe letal.",
  Dracónido:
    "Resistencia al fuego y aliento ígneo (una acción, una carga, alcance 3, área en cruz).",
};
export const classes = {
  Guerrero: {
    hp: 24,
    def: 15,
    range: 1,
    die: 8,
    stat: "Fuerza",
    move: 4,
    skill: "guard",
    gear: "Espada · armadura pesada · escudo",
    desc: "Protege pasos y aliados. Menor movilidad.",
  },
  Bárbaro: {
    hp: 28,
    def: 12,
    range: 1,
    die: 10,
    stat: "Fuerza",
    move: 5,
    skill: "rage",
    gear: "Hacha · armadura ligera",
    desc: "Furia aumenta daño y reduce daño físico; pierde defensa.",
  },
  Pícaro: {
    hp: 18,
    def: 14,
    range: 1,
    die: 6,
    stat: "Destreza",
    move: 6,
    skill: "ambush",
    gear: "Dagas · cuero",
    desc: "Golpe oportunista: daño extra contra un enemigo junto a un aliado o inmovilizado.",
  },
  Mago: {
    hp: 14,
    def: 11,
    range: 6,
    die: 6,
    stat: "Inteligencia",
    move: 4,
    skill: "frost",
    gear: "Bastón · túnica",
    desc: "Escarcha daña y ralentiza un área. Vulnerable al cuerpo a cuerpo.",
  },
  Clérigo: {
    hp: 21,
    def: 14,
    range: 4,
    die: 6,
    stat: "Sabiduría",
    move: 4,
    skill: "bless",
    gear: "Símbolo · cota",
    desc: "Bendición cura y refuerza la defensa de un aliado.",
  },
  Explorador: {
    hp: 20,
    def: 13,
    range: 7,
    die: 8,
    stat: "Destreza",
    move: 5,
    skill: "pin",
    gear: "Arco · cuero",
    desc: "Disparo de sujeción inmoviliza a distancia.",
  },
} as const;
export type Race = keyof typeof races;
export type Class = keyof typeof classes;
export interface Ability {
  id: string;
  name: string;
  description: string;
  action: "main" | "bonus";
  range: number;
  cost: number;
  target: "enemy" | "ally" | "self";
  effect: "damage" | "slow" | "root" | "guard" | "rage" | "heal" | "area";
  duration: number;
  condition: string;
  damageType: "physical" | "cold" | "fire" | "radiant";
}
export const abilities: Record<string, Ability> = {
  attack: {
    id: "attack",
    name: "Ataque básico",
    description: "Tirada d20 contra defensa. El arma determina alcance y daño.",
    action: "main",
    range: 0,
    cost: 0,
    target: "enemy",
    effect: "damage",
    duration: 0,
    condition: "Objetivo vivo, visible y a alcance.",
    damageType: "physical",
  },
  guard: {
    id: "guard",
    name: "Postura protectora",
    description:
      "Durante una ronda: +2 defensa a aliados adyacentes; enemigos próximos no pueden alejarse; una reacción de represalia.",
    action: "main",
    range: 0,
    cost: 1,
    target: "self",
    effect: "guard",
    duration: 1,
    condition: "Requiere una acción y un recurso.",
    damageType: "physical",
  },
  rage: {
    id: "rage",
    name: "Furia",
    description:
      "Dos rondas: +3 daño físico, mitad de daño físico recibido y −2 defensa. Habilita una poción como acción adicional este turno.",
    action: "main",
    range: 0,
    cost: 1,
    target: "self",
    effect: "rage",
    duration: 2,
    condition: "No estar ya en furia.",
    damageType: "physical",
  },
  ambush: {
    id: "ambush",
    name: "Golpe oportunista",
    description:
      "Ataque con +1d6 de daño si el objetivo está inmovilizado o junto a otro aliado.",
    action: "main",
    range: 1,
    cost: 1,
    target: "enemy",
    effect: "damage",
    duration: 0,
    condition: "Objetivo inmovilizado o distraído por un aliado.",
    damageType: "physical",
  },
  frost: {
    id: "frost",
    name: "Estallido de escarcha",
    description:
      "Inflige 1d6 + atributo, sin tirada, al objetivo y enemigos a una casilla. Ralentiza dos turnos.",
    action: "main",
    range: 5,
    cost: 1,
    target: "enemy",
    effect: "slow",
    duration: 2,
    condition: "Centro visible; paredes bloquean la expansión.",
    damageType: "cold",
  },
  bless: {
    id: "bless",
    name: "Bendición sanadora",
    description: "Cura 1d6 + Sabiduría y otorga +2 defensa dos turnos.",
    action: "main",
    range: 4,
    cost: 1,
    target: "ally",
    effect: "heal",
    duration: 2,
    condition: "Aliado vivo y visible (incluido uno mismo).",
    damageType: "radiant",
  },
  pin: {
    id: "pin",
    name: "Disparo de sujeción",
    description: "Ataque que inmoviliza dos turnos si impacta.",
    action: "main",
    range: 7,
    cost: 1,
    target: "enemy",
    effect: "root",
    duration: 2,
    condition: "Objetivo visible.",
    damageType: "physical",
  },
  breath: {
    id: "breath",
    name: "Aliento ígneo",
    description:
      "1d6 + Constitución de fuego en cruz alrededor del objetivo. Una carga por encuentro.",
    action: "main",
    range: 3,
    cost: 0,
    target: "enemy",
    effect: "area",
    duration: 0,
    condition: "Solo dracónidos con carga disponible.",
    damageType: "fire",
  },
  potion: {
    id: "potion",
    name: "Poción",
    description:
      "Recupera 8 PV. Una por personaje; usa acción adicional solo durante el turno en que se activa Furia.",
    action: "bonus",
    range: 0,
    cost: 0,
    target: "self",
    effect: "heal",
    duration: 0,
    condition: "Poción disponible y acción principal o adicional.",
    damageType: "radiant",
  },
};
export const defaultStats = (c: Class): Stats => {
  const s: Stats = {
    Fuerza: 10,
    Destreza: 12,
    Constitución: 12,
    Inteligencia: 10,
    Sabiduría: 10,
    Carisma: 10,
  };
  s[classes[c].stat] = 15;
  return s;
};
export const pointCost = (s: Stats) =>
  Object.values(s).reduce((n, v) => n + v - 8 + (v > 13 ? v - 13 : 0), 0);
export const XP_THRESHOLDS = [0, 100, 300, 600, 1000];
