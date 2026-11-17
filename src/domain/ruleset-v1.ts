export const RULESET_V1_ID = "werewolf-god-v1";
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 75;

export const ROLE_IDS = [
  "werewolf",
  "bodyguard",
  "witch",
  "seer",
  "villager",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const NIGHT_ROLE_ORDER = [
  "werewolf",
  "bodyguard",
  "witch",
  "seer",
] as const;

export type NightRole = (typeof NIGHT_ROLE_ORDER)[number];

export const ROLE_LABELS: Record<RoleId, string> = {
  werewolf: "Lobisomem",
  bodyguard: "Guarda-costas",
  witch: "Bruxa",
  seer: "Vidente",
  villager: "Aldeão",
};

export function hasNightAction(role: RoleId): role is NightRole {
  switch (role) {
    case "werewolf":
    case "bodyguard":
    case "witch":
    case "seer":
      return true;
    case "villager":
      return false;
  }
}
