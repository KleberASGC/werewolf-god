export const RULESET_V1_ID = "werewolf-god-v1";
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 75;

export const ROLE_IDS = [
  "werewolf",
  "bodyguard",
  "priest",
  "witch",
  "seer",
  "revealer",
  "lycan",
  "cursed",
  "spellcaster",
  "cupid",
  "hooker",
  "mentalist",
  "villager",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const NIGHT_ROLE_ORDER = [
  "werewolf",
  "bodyguard",
  "priest",
  "witch",
  "seer",
  "revealer",
  "spellcaster",
  "cupid",
  "hooker",
  "mentalist",
] as const;

export type NightRole = (typeof NIGHT_ROLE_ORDER)[number];

export const ROLE_LABELS: Record<RoleId, string> = {
  werewolf: "Lobisomem",
  bodyguard: "Guarda-costas",
  witch: "Bruxa",
  seer: "Vidente",
  revealer: "Denunciador",
  lycan: "Lycan",
  cursed: "Amaldiçoado",
  spellcaster: "Conjurador",
  cupid: "Cupido",
  hooker: "Quenga",
  mentalist: "Mentalista",
  priest: "Padre",
  villager: "Aldeão",
};

export function appearsAsWerewolfToSeer(role: RoleId): boolean {
  return role === "werewolf" || role === "lycan";
}

export function hasNightAction(role: RoleId): role is NightRole {
  switch (role) {
    case "werewolf":
    case "bodyguard":
    case "witch":
    case "seer":
    case "revealer":
    case "spellcaster":
    case "cupid":
    case "hooker":
    case "mentalist":
    case "priest":
      return true;
    case "lycan":
    case "cursed":
    case "villager":
      return false;
  }
}
