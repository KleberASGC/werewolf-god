import type { Game } from "../domain/game";

const DATABASE_NAME = "werewolf-god";
const DATABASE_VERSION = 1;
const GAME_STORE = "games";

let databasePromise: Promise<IDBDatabase> | undefined;

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

function openDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("Este navegador não oferece armazenamento local compatível."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(GAME_STORE)) {
          const store = database.createObjectStore(GAME_STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
      };

      request.onsuccess = () => {
        const database = request.result;
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
    });
  }

  return databasePromise;
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
