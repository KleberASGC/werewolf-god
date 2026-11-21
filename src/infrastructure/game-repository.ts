import type { Game } from "../domain/game";
import type { MatchState } from "../domain/match";
import { NIGHT_ROLE_ORDER, ROLE_IDS, RULESET_V1_ID } from "../domain/ruleset-v1";

const DATABASE_NAME = "werewolf-god";
const DATABASE_VERSION = 2;
const GAME_STORE = "games";
const MATCH_STORE = "matches";
const MATCH_FORMAT_VERSION = 1;
const BACKUP_FORMAT = "werewolf-god-backup";
const BACKUP_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | undefined;

export interface GameBackupEntry {
  game: Game;
  match?: MatchState;
}

export interface GameBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  games: GameBackupEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlayer(value: unknown): value is Game["players"][number] {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isGame(value: unknown): value is Game {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.players) &&
    value.players.length > 0 &&
    value.players.every(isPlayer)
  );
}

function isOneOf(value: unknown, options: readonly string[]): boolean {
  return typeof value === "string" && options.includes(value);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isAction(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.kind === "witch") {
    return isOptionalString(value.protectTargetId) && isOptionalString(value.eliminateTargetId);
  }
  return isOneOf(value.kind, [
    "werewolf-attack",
    "bodyguard-protect",
    "seer-investigate",
    "revealer-denounce",
    "spellcaster-silence",
    "hooker-sleep",
  ]) &&
    typeof value.targetId === "string";
}

function isActionRecord(value: unknown): boolean {
  return isRecord(value) && isOneOf(value.role, NIGHT_ROLE_ORDER) && isAction(value.action);
}

function isHistoryEntry(value: unknown): boolean {
  if (!isRecord(value) || !Number.isInteger(value.round)) return false;
  if (value.type === "night-resolved") {
    return Array.isArray(value.actions) && value.actions.every(isActionRecord) &&
      isStringArray(value.eliminatedPlayerIds) && isStringArray(value.protectedPlayerIds) &&
      (value.convertedPlayerIds === undefined || isStringArray(value.convertedPlayerIds)) &&
      (value.pendingCursedConversionPlayerIds === undefined ||
        isStringArray(value.pendingCursedConversionPlayerIds)) &&
      isStringArray(value.blockedAttackTargetIds) && Array.isArray(value.investigations) &&
      value.investigations.every((item: unknown) =>
        isRecord(item) && typeof item.targetId === "string" && typeof item.isWerewolf === "boolean");
  }
  return value.type === "vote-resolved" &&
    isOneOf(value.outcome, ["annulled-majority", "annulled-tie", "annulled-plurality", "exiled"]) &&
    Number.isInteger(value.annulVotes) && isRecord(value.counts) &&
    Object.values(value.counts).every((count) => Number.isInteger(count)) &&
    isOptionalString(value.exiledPlayerId);
}

function isMatch(value: unknown): value is MatchState {
  if (!isRecord(value) || value.rulesetId !== RULESET_V1_ID ||
      typeof value.id !== "string" || typeof value.name !== "string" ||
      !Number.isInteger(value.dayDurationMinutes) || !Number.isInteger(value.round) ||
      !isOneOf(value.phase, ["prepared", "night", "seer-result", "night-resolution", "dawn", "discussion", "voting", "ready-for-night", "finished"]) ||
      !Array.isArray(value.players) || !value.players.every((player: unknown) =>
        isRecord(player) && typeof player.id === "string" && typeof player.name === "string" &&
        isOneOf(player.role, ROLE_IDS) && isOneOf(player.status, ["alive", "dead", "exiled"]) &&
        (player.convertedFromCursed === undefined ||
          (player.convertedFromCursed === true && player.role === "werewolf")) &&
        (player.pendingCursedConversion === undefined ||
          (player.pendingCursedConversion === true && player.role === "cursed")) &&
        (player.eliminatedAtRound === undefined || Number.isInteger(player.eliminatedAtRound)) &&
        (player.eliminationCause === undefined || isOneOf(player.eliminationCause, ["night", "vote"]))) ||
      !isRecord(value.witchResources) || typeof value.witchResources.protectionUsed !== "boolean" ||
      typeof value.witchResources.eliminationUsed !== "boolean" ||
      !isOptionalString(value.lastBodyguardTargetId) ||
      !isOptionalString(value.lastSpellcasterTargetId) ||
      !Array.isArray(value.history) || !value.history.every(isHistoryEntry) ||
      (value.winner !== undefined && !isOneOf(value.winner, ["werewolves", "villagers"]))) return false;

  if (value.night !== undefined && (!isRecord(value.night) ||
      !Array.isArray(value.night.schedule) || !value.night.schedule.every((role: unknown) => isOneOf(role, NIGHT_ROLE_ORDER)) ||
      !Number.isInteger(value.night.nextCallIndex) || !Array.isArray(value.night.actions) ||
      (value.night.awakeningRequired !== undefined && typeof value.night.awakeningRequired !== "boolean") ||
      (value.night.awakenedCursedPlayerIds !== undefined &&
        !isStringArray(value.night.awakenedCursedPlayerIds)) ||
      !value.night.actions.every(isActionRecord))) return false;
  if (isRecord(value.night) && value.night.awakeningRequired === true &&
      (value.night.nextCallIndex !== 0 || !Array.isArray(value.night.schedule) ||
        value.night.schedule[0] !== "werewolf" ||
        value.players.filter((player) =>
          isRecord(player) && player.status === "alive" && player.pendingCursedConversion === true,
        ).length !== 1)) return false;
  if (value.players.filter((player) =>
    isRecord(player) && (player.role === "cursed" || player.convertedFromCursed === true),
  ).length > 1) return false;
  if (value.players.filter((player) => isRecord(player) && player.role === "revealer").length > 1) {
    return false;
  }
  if (value.players.filter((player) => isRecord(player) && player.role === "hooker").length > 1) {
    return false;
  }
  if (value.discussion !== undefined && (!isRecord(value.discussion) ||
      !isOneOf(value.discussion.status, ["running", "paused", "ended", "expired"]) ||
      typeof value.discussion.remainingMs !== "number" || !Number.isFinite(value.discussion.remainingMs) ||
      (value.discussion.startedAtMs !== null && (typeof value.discussion.startedAtMs !== "number" ||
        !Number.isFinite(value.discussion.startedAtMs))))) return false;
  if (value.voting !== undefined && (!isRecord(value.voting) || !isStringArray(value.voting.order) ||
      !Number.isInteger(value.voting.nextVoterIndex) || !Array.isArray(value.voting.votes) ||
      !value.voting.votes.every((vote: unknown) => isRecord(vote) && typeof vote.voterId === "string" &&
        isRecord(vote.choice) && (vote.choice.kind === "annul" ||
          (vote.choice.kind === "player" && typeof vote.choice.playerId === "string"))))) return false;
  if ((value.phase === "night" || value.phase === "seer-result" || value.phase === "night-resolution") && value.night === undefined) return false;
  if (value.phase === "seer-result" &&
      (!isRecord(value.night) || !Array.isArray(value.night.actions) ||
        !value.night.actions.some((record: unknown) =>
          isRecord(record) && record.role === "seer" && isRecord(record.action) &&
          record.action.kind === "seer-investigate"))) return false;
  if (value.phase === "discussion" && value.discussion === undefined) return false;
  if (value.phase === "voting" && value.voting === undefined) return false;
  if (value.phase === "finished" && value.winner === undefined) return false;
  return true;
}

export function parseBackup(value: unknown): GameBackup {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION ||
      typeof value.exportedAt !== "string" || !Array.isArray(value.games)) {
    throw new Error("O arquivo não é um backup Werewolf God compatível.");
  }

  const ids = new Set<string>();
  const games: GameBackupEntry[] = [];
  for (const entry of value.games) {
    if (!isRecord(entry) || !isGame(entry.game) ||
        (entry.match !== undefined && (!isMatch(entry.match) || entry.match.id !== entry.game.id)) ||
        ids.has(entry.game.id)) {
      throw new Error("O backup contém partidas inválidas, duplicadas ou incompatíveis.");
    }
    ids.add(entry.game.id);
    games.push(entry.match ? { game: entry.game, match: entry.match } : { game: entry.game });
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: value.exportedAt,
    games,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("Este navegador não oferece armazenamento local compatível."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      let blocked = false;

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(GAME_STORE)) {
          const store = database.createObjectStore(GAME_STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!database.objectStoreNames.contains(MATCH_STORE)) {
          database.createObjectStore(MATCH_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        const database = request.result;
        if (blocked) {
          database.close();
          return;
        }
        database.onversionchange = () => {
          database.close();
          databasePromise = undefined;
        };
        resolve(database);
      };

      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
      };
      request.onblocked = () => {
        blocked = true;
        databasePromise = undefined;
        reject(new Error("Feche outras abas do aplicativo e tente novamente para atualizar o armazenamento."));
      };
    });
  }

  return databasePromise;
}

export async function createBackup(): Promise<GameBackup> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GAME_STORE, MATCH_STORE], "readonly");
    const gamesRequest = transaction.objectStore(GAME_STORE).getAll();
    const matchesRequest = transaction.objectStore(MATCH_STORE).getAll();
    let games: unknown[] = [];
    let matches: unknown[] = [];

    gamesRequest.onsuccess = () => { games = gamesRequest.result; };
    matchesRequest.onsuccess = () => { matches = matchesRequest.result; };
    transaction.oncomplete = () => {
      const validGames: Game[] = [];
      for (const game of games) {
        if (!isGame(game)) {
          reject(new Error("Há cadastros inválidos no armazenamento local; não foi possível exportar."));
          return;
        }
        validGames.push(game);
      }

      const matchesById = new Map<string, MatchState>();
      for (const saved of matches) {
        if (!isRecord(saved) || typeof saved.id !== "string" ||
            saved.version !== MATCH_FORMAT_VERSION || !isMatch(saved.match) ||
            saved.match.id !== saved.id || matchesById.has(saved.id)) {
          reject(new Error("Há progresso inválido no armazenamento local; não foi possível exportar."));
          return;
        }
        matchesById.set(saved.id, saved.match);
      }

      const gameIds = new Set(validGames.map((game) => game.id));
      if ([...matchesById.keys()].some((id) => !gameIds.has(id))) {
        reject(new Error("Há progresso sem cadastro correspondente; não foi possível exportar."));
        return;
      }

      resolve({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        games: validGames.map((game) => {
          const match = matchesById.get(game.id);
          return match ? { game, match } : { game };
        }),
      });
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível exportar os dados locais."));
    transaction.onabort = () => reject(transaction.error ?? new Error("A exportação dos dados locais foi interrompida."));
  });
}

export async function importBackup(value: unknown): Promise<number> {
  const backup = parseBackup(value);
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GAME_STORE, MATCH_STORE], "readwrite");
    transaction.oncomplete = () => resolve(backup.games.length);
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível importar o backup."));
    transaction.onabort = () => reject(transaction.error ?? new Error("A importação do backup foi interrompida."));

    try {
      const gameStore = transaction.objectStore(GAME_STORE);
      const matchStore = transaction.objectStore(MATCH_STORE);
      for (const { game, match } of backup.games) {
        gameStore.put(game);
        if (match) {
          matchStore.put({ id: game.id, version: MATCH_FORMAT_VERSION, match });
        } else {
          matchStore.delete(game.id);
        }
      }
    } catch (error: unknown) {
      transaction.abort();
      reject(error);
    }
  });
}

export async function getMatch(gameId: string): Promise<MatchState | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MATCH_STORE, "readonly");
    const request = transaction.objectStore(MATCH_STORE).get(gameId);
    let match: MatchState | undefined;
    request.onsuccess = () => {
      const saved: unknown = request.result;
      if (saved === undefined) return;
      if (!isRecord(saved) || saved.id !== gameId || saved.version !== MATCH_FORMAT_VERSION ||
          !isMatch(saved.match) || saved.match.id !== gameId) {
        reject(new Error("O progresso salvo é inválido ou usa uma versão de dados ou regras incompatível."));
        return;
      }
      match = saved.match;
    };
    transaction.oncomplete = () => resolve(match);
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível carregar o progresso."));
    transaction.onabort = () => reject(transaction.error ?? new Error("A leitura do progresso foi interrompida."));
  });
}

export async function saveMatch(match: MatchState): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(MATCH_STORE, "readwrite");
    transaction.objectStore(MATCH_STORE).put({ id: match.id, version: MATCH_FORMAT_VERSION, match });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar o progresso."));
    transaction.onabort = () => reject(transaction.error ?? new Error("O salvamento do progresso foi interrompido."));
  });
}

export async function saveGameAndMatch(game: Game, match: MatchState): Promise<void> {
  if (game.id !== match.id) throw new Error("O cadastro e a partida não correspondem.");
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GAME_STORE, MATCH_STORE], "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar a partida."));
    transaction.onabort = () => reject(transaction.error ?? new Error("O salvamento da partida foi interrompido."));
    try {
      transaction.objectStore(GAME_STORE).put(game);
      transaction.objectStore(MATCH_STORE).put({ id: match.id, version: MATCH_FORMAT_VERSION, match });
    } catch (error: unknown) {
      transaction.abort();
      reject(error);
    }
  });
}

export async function listGames(): Promise<Game[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GAME_STORE, "readonly");
    const request = transaction.objectStore(GAME_STORE).getAll();
    let games: Game[] = [];

    request.onsuccess = () => {
      const savedGames: unknown[] = request.result;
      if (!savedGames.every(isGame)) {
        reject(new Error("Há dados de partida inválidos no armazenamento local."));
        return;
      }
      games = savedGames;
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Não foi possível carregar as partidas."));
    };

    transaction.oncomplete = () => {
      resolve(games.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("A leitura das partidas foi interrompida."));
    };
  });
}

export async function saveGame(game: Game): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(GAME_STORE, "readwrite");
    transaction.objectStore(GAME_STORE).put(game);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Não foi possível salvar a partida."));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("O salvamento da partida foi interrompido."));
    };
  });
}

export async function deleteGame(gameId: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([GAME_STORE, MATCH_STORE], "readwrite");
    transaction.objectStore(GAME_STORE).delete(gameId);
    transaction.objectStore(MATCH_STORE).delete(gameId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Não foi possível excluir a partida."));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("A exclusão da partida foi interrompida."));
    };
  });
}
