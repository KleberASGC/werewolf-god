import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLE_IDS,
  RULESET_V1_ID,
  type RoleId,
} from "./ruleset-v1";
import type { MatchPlayer, MatchState } from "./match";

export type RandomSource = () => number;

export interface PlayerInput {
  id: string;
  name: string;
}

export interface CreateMatchInput {
  id: string;
  name: string;
  players: PlayerInput[];
  roleCounts: Partial<Record<RoleId, number>>;
  dayDurationMinutes: number;
}

const defaultRandom: RandomSource = Math.random;

function shuffle<T>(values: T[], random: RandomSource): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new Error("A fonte aleatória deve retornar um valor entre 0 e 1.");
    }

    const swapIndex = Math.floor(sample * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createMatch(
  input: CreateMatchInput,
  random: RandomSource = defaultRandom,
): MatchState {
  const name = input.name.trim();
  const players = input.players.map((player) => ({
    id: player.id.trim(),
    name: player.name.trim(),
  }));

  if (!input.id.trim()) {
    throw new Error("A partida precisa de um identificador.");
  }
  if (!name) {
    throw new Error("Dê um nome para a partida.");
  }
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`A partida deve ter entre ${MIN_PLAYERS} e ${MAX_PLAYERS} jogadores.`);
  }
  if (players.some((player) => !player.id || !player.name)) {
    throw new Error("Informe um identificador e um nome para cada jogador.");
  }
  if (new Set(players.map((player) => player.id)).size !== players.length) {
    throw new Error("Cada jogador precisa ter um identificador único.");
  }

  const knownRoles = new Set<string>(ROLE_IDS);
  const unknownRoles = Object.keys(input.roleCounts).filter((role) => !knownRoles.has(role));
  if (unknownRoles.length > 0) {
    throw new Error("A composição contém uma função desconhecida.");
  }

  const counts: Record<RoleId, number> = {
    werewolf: input.roleCounts.werewolf ?? 0,
    bodyguard: input.roleCounts.bodyguard ?? 0,
    witch: input.roleCounts.witch ?? 0,
    seer: input.roleCounts.seer ?? 0,
    revealer: input.roleCounts.revealer ?? 0,
    lycan: input.roleCounts.lycan ?? 0,
    cursed: input.roleCounts.cursed ?? 0,
    spellcaster: input.roleCounts.spellcaster ?? 0,
    hooker: input.roleCounts.hooker ?? 0,
    villager: input.roleCounts.villager ?? 0,
  };

  if (Object.values(counts).some((count) => !Number.isInteger(count) || count < 0)) {
    throw new Error("A quantidade de cartas de cada função deve ser um inteiro não negativo.");
  }

  const totalCards = Object.values(counts).reduce((total, count) => total + count, 0);
  if (totalCards !== players.length) {
    throw new Error("A quantidade total de cartas deve ser igual à quantidade de jogadores.");
  }
  if (counts.werewolf < 1) {
    throw new Error("A partida precisa ter ao menos um Lobisomem.");
  }
  if (counts.werewolf >= players.length - counts.werewolf) {
    throw new Error("Deve haver mais jogadores não Lobisomens do que Lobisomens.");
  }
  if (counts.cursed > 1) {
    throw new Error("A partida pode ter no máximo um Amaldiçoado.");
  }
  if (counts.revealer > 1) {
    throw new Error("A partida pode ter no máximo um Denunciador.");
  }
  if (counts.hooker > 1) {
    throw new Error("A partida pode ter no máximo uma Quenga.");
  }
  if (
    !Number.isInteger(input.dayDurationMinutes) ||
    input.dayDurationMinutes < 1 ||
    input.dayDurationMinutes > 10
  ) {
    throw new Error("A duração do dia deve ser um número inteiro entre 1 e 10 minutos.");
  }

  const roles = ROLE_IDS.flatMap((role) => Array<RoleId>(counts[role]).fill(role));
  const shuffledRoles = shuffle(roles, random);
  const assignedPlayers: MatchPlayer[] = players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    status: "alive",
  }));

  return {
    id: input.id.trim(),
    name,
    rulesetId: RULESET_V1_ID,
    players: assignedPlayers,
    dayDurationMinutes: input.dayDurationMinutes,
    phase: "prepared",
    round: 0,
    witchResources: {
      protectionUsed: false,
      eliminationUsed: false,
    },
    history: [],
  };
}

export function shuffleOrder<T>(values: T[], random: RandomSource = defaultRandom): T[] {
  return shuffle(values, random);
}
