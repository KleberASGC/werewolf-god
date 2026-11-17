import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGame } from "../domain/game";
import {
  endDiscussion,
  recordVote,
  resolveNight,
  resolveVoting,
  startDiscussion,
  startMatch,
  startVoting,
  submitNightCall,
  updateDiscussionClock,
} from "../domain/match-engine";
import { createMatch } from "../domain/match-setup";
import type { MatchState } from "../domain/match";
import { deleteGame, getMatch, listGames, saveGameAndMatch, saveMatch } from "./game-repository";

describe("match persistence", () => {
  it("preserves legacy game records during migration", async () => {
    const game = createGame({
      id: "legacy",
      name: "Cadastro antigo",
      players: [{ id: "player", name: "Participante" }],
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("werewolf-god", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("games", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.put(game);
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
    });
    assert.deepEqual(await listGames(), [game]);
    assert.equal(await getMatch(game.id), undefined);
  });

  it("saves and resumes role assignment, actions, timer, votes, and history", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({ id: "complete", name: "Mesa", players, createdAt: "2026-01-01T00:00:00.000Z" });
    let match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: (["werewolf", "bodyguard", "witch", "seer", "villager"] as const)[index],
    }));

    async function roundTrip(state: MatchState): Promise<MatchState> {
      await saveMatch(state);
      const restored = await getMatch(state.id);
      assert.deepEqual(restored, state);
      assert.ok(restored);
      return restored;
    }

    await saveGameAndMatch(game, match);
    assert.deepEqual(await getMatch(game.id), match);
    assert.ok((await listGames()).some((saved) => saved.id === game.id));
    await assert.rejects(saveMatch(Object.assign({}, match, { invalid: () => {} })));
    assert.deepEqual(await getMatch(game.id), match);

    match = startMatch(match);
    match = submitNightCall(match, "werewolf", { kind: "werewolf-attack", targetId: "player-5" });
    match = await roundTrip(match);
    match = submitNightCall(match, "bodyguard", { kind: "bodyguard-protect", targetId: "player-5" });
    match = submitNightCall(match, "witch");
    match = submitNightCall(match, "seer", { kind: "seer-investigate", targetId: "player-2" });
    match = await roundTrip(match);
    match = resolveNight(match).match;
    match = startDiscussion(match, 1_000);
    match = await roundTrip(match);
    assert.equal(updateDiscussionClock(match, 61_000).discussion?.status, "expired");
    match = startVoting(endDiscussion(match, 2_000), () => 0.5);
    const voterId = match.voting!.order[0];
    match = recordVote(match, voterId, { kind: "annul" });
    match = await roundTrip(match);
    for (const voter of match.voting!.order.slice(1)) {
      match = recordVote(match, voter, { kind: "annul" });
    }
    match = resolveVoting(match).match;
    match = await roundTrip(match);
    assert.equal(match.history.length, 2);
    match = await roundTrip({ ...match, phase: "finished", winner: "villagers" });
    assert.equal(match.winner, "villagers");

    await deleteGame(game.id);
    assert.equal(await getMatch(game.id), undefined);
    assert.ok(!(await listGames()).some((saved) => saved.id === game.id));
  });

  it("does not partially save a game record when progress persistence fails", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({ id: `${index}`, name: `P${index}` }));
    const game = createGame({ id: "failure", name: "Falha", players, createdAt: "2026-01-01T00:00:00.000Z" });
    const match = createMatch({
      id: game.id, name: game.name, players, roleCounts: { werewolf: 1, villager: 4 }, dayDurationMinutes: 1,
    });
    await assert.rejects(saveGameAndMatch(game, Object.assign(match, { invalid: () => {} })));
    assert.ok(!(await listGames()).some((saved) => saved.id === game.id));
    assert.equal(await getMatch(game.id), undefined);
  });

  it("rejects unknown progress versions without overwriting them", async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("werewolf-god", 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("matches", "readwrite");
        transaction.objectStore("matches").put({ id: "future", version: 999, match: {} });
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onabort = () => { database.close(); reject(transaction.error); };
      };
    });
    await assert.rejects(getMatch("future"), /incompatível/);
    await assert.rejects(getMatch("future"), /incompatível/);
    await deleteGame("future");
  });
});
