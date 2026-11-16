export interface Player {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  name: string;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameInput {
  id: string;
  name: string;
  players: Player[];
  createdAt: string;
}

export function createGame(input: CreateGameInput): Game {
  const name = input.name.trim();
  const players = input.players.map((player) => ({ ...player, name: player.name.trim() }));

  if (!name) {
    throw new Error("Dê um nome para a partida.");
  }

  if (players.length === 0 || players.some((player) => !player.name)) {
    throw new Error("Informe o nome de cada participante.");
  }

  return {
    id: input.id,
    name,
    players,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}
