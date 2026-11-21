import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGame } from "../domain/game";
import {
  awakenCursed,
  endDiscussion,
  continueAfterSeerResult,
  recordVote,
  resolveNight,
  resolveVoting,
  startDiscussion,
  startMatch,
  startNextNight,
  startVoting,
  submitNightCall,
  updateDiscussionClock,
} from "../domain/match-engine";
import { createMatch } from "../domain/match-setup";
import type { MatchState } from "../domain/match";
import {
  createBackup,
  deleteGame,
  getMatch,
  importBackup,
  listGames,
  saveGame,
  saveGameAndMatch,
  saveMatch,
} from "./game-repository";

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
    await deleteGame(game.id);
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
      roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, lycan: 1 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: (["werewolf", "bodyguard", "witch", "seer", "lycan"] as const)[index],
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
    match = continueAfterSeerResult(match);
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

  it("persists and backs up a Cursed conversion without breaking older match history", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `cursed-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "cursed-backup",
      name: "Partida Amaldiçoada",
      players,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const prepared = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, cursed: 1, bodyguard: 1, witch: 1, seer: 1 },
      dayDurationMinutes: 5,
    });
    let match: MatchState = {
      ...prepared,
      players: prepared.players.map((player, index) => ({
        ...player,
        role: (["werewolf", "cursed", "bodyguard", "witch", "seer"] as const)[index],
      })),
    };
    match = startMatch(match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "cursed-player-2",
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "cursed-player-3",
    });
    match = submitNightCall(match, "witch");
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: "cursed-player-2",
    });
    match = continueAfterSeerResult(match);
    match = resolveNight(match).match;
    await saveGameAndMatch(game, match);

    assert.deepEqual(await getMatch(game.id), match);
    const backup = await createBackup();
    assert.deepEqual(backup.games.find((entry) => entry.game.id === game.id)?.match, match);
    assert.equal(await importBackup(backup), 1);
    assert.deepEqual(await getMatch(game.id), match);
    assert.equal(
      (await getMatch(game.id))?.players.find((player) => player.id === "cursed-player-2")?.pendingCursedConversion,
      true,
    );

    let discussion = startDiscussion(match, 0);
    discussion = endDiscussion(discussion, 0);
    let voting = startVoting(discussion, () => 0.5);
    for (const voterId of voting.voting!.order) {
      voting = recordVote(voting, voterId, { kind: "annul" });
    }
    match = startNextNight(resolveVoting(voting).match);
    assert.equal(match.night?.awakeningRequired, true);
    await saveMatch(match);
    assert.deepEqual(await getMatch(game.id), match);

    match = awakenCursed(match);
    await saveMatch(match);
    assert.deepEqual(await getMatch(game.id), match);
    const awakenedBackup = await createBackup();
    assert.deepEqual(awakenedBackup.games.find((entry) => entry.game.id === game.id)?.match, match);
    assert.equal(
      (await getMatch(game.id))?.players.find((player) => player.id === "cursed-player-2")?.convertedFromCursed,
      true,
    );

    const legacyMatch: MatchState = {
      ...match,
      players: match.players.map((player) => player.id === "cursed-player-2"
        ? {
            id: player.id,
            name: player.name,
            role: "werewolf" as const,
            status: player.status,
            convertedFromCursed: true,
          }
        : player),
      history: match.history.map((entry) => {
        if (entry.type !== "night-resolved") return entry;
        const { pendingCursedConversionPlayerIds: _pending, ...oldEntry } = entry;
        return { ...oldEntry, convertedPlayerIds: ["cursed-player-2"] };
      }),
    };
    await saveMatch(legacyMatch);
    assert.deepEqual(await getMatch(game.id), legacyMatch);
    await deleteGame(game.id);
  });

  it("round-trips Conjurador actions and repeat-target state through backups", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `spellcaster-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "spellcaster-backup",
      name: "Partida com Conjurador",
      players,
      createdAt: "2026-01-04T00:00:00.000Z",
    });
    const roles = ["werewolf", "seer", "spellcaster", "villager", "villager"] as const;
    let match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, seer: 1, spellcaster: 1, villager: 2 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: roles[index],
    }));

    match = startMatch(match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: players[3].id,
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: players[0].id,
    });
    match = continueAfterSeerResult(match);
    match = submitNightCall(match, "spellcaster", {
      kind: "spellcaster-silence",
      targetId: players[2].id,
    });
    const resolved = resolveNight(match).match;
    assert.equal(resolved.lastSpellcasterTargetId, players[2].id);

    await saveGameAndMatch(game, resolved);
    const backup = await createBackup();
    assert.deepEqual(
      backup.games.find((entry) => entry.game.id === game.id)?.match,
      resolved,
    );
    assert.equal(await importBackup(backup), 1);
    assert.deepEqual(await getMatch(game.id), resolved);
    await deleteGame(game.id);
  });

  it("round-trips a Denunciador action through saved progress and backups", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `revealer-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "revealer-backup",
      name: "Partida com Denunciador",
      players,
      createdAt: "2026-01-05T00:00:00.000Z",
    });
    const roles = ["werewolf", "revealer", "bodyguard", "witch", "seer"] as const;
    let match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, revealer: 1, bodyguard: 1, witch: 1, seer: 1 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: roles[index],
    }));

    match = startMatch(match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: players[4].id,
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: players[3].id,
    });
    match = submitNightCall(match, "witch");
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: players[1].id,
    });
    match = continueAfterSeerResult(match);
    match = submitNightCall(match, "revealer", {
      kind: "revealer-denounce",
      targetId: players[0].id,
    });
    match = resolveNight(match).match;

    await saveGameAndMatch(game, match);
    assert.deepEqual(await getMatch(game.id), match);
    const backup = await createBackup();
    assert.deepEqual(
      backup.games.find((entry) => entry.game.id === game.id)?.match,
      match,
    );
    assert.equal(await importBackup(backup), 1);
    const restored = await getMatch(game.id);
    assert.deepEqual(restored, match);
    const nightHistory = restored?.history[0];
    assert.ok(nightHistory?.type === "night-resolved");
    assert.ok(nightHistory.actions.some((record) => record.role === "revealer"));
    await deleteGame(game.id);
  });

  it("round-trips a Quenga action through saved progress and backups", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `hooker-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "hooker-backup",
      name: "Partida com Quenga",
      players,
      createdAt: "2026-01-05T00:00:00.000Z",
    });
    const roles = ["werewolf", "hooker", "bodyguard", "seer", "villager"] as const;
    let match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, hooker: 1, bodyguard: 1, seer: 1, villager: 1 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: roles[index],
    }));

    match = startMatch(match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: players[4].id,
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: players[2].id,
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: players[4].id,
    });
    match = continueAfterSeerResult(match);
    match = submitNightCall(match, "hooker", {
      kind: "hooker-sleep",
      targetId: players[4].id,
    });
    match = resolveNight(match).match;

    await saveGameAndMatch(game, match);
    assert.deepEqual(await getMatch(game.id), match);
    const backup = await createBackup();
    assert.deepEqual(
      backup.games.find((entry) => entry.game.id === game.id)?.match,
      match,
    );
    assert.equal(await importBackup(backup), 1);
    assert.deepEqual(await getMatch(game.id), match);
    const nightHistory = match.history[0];
    assert.ok(nightHistory?.type === "night-resolved");
    assert.deepEqual(nightHistory.actions.find((record) => record.role === "hooker")?.action, {
      kind: "hooker-sleep",
      targetId: players[4].id,
    });
    await deleteGame(game.id);
  });

  it("round-trips the Cupido pair and first-night action through backups", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `cupid-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "cupid-backup",
      name: "Partida com Cupido",
      players,
      createdAt: "2026-01-06T00:00:00.000Z",
    });
    const roles = ["werewolf", "cupid", "bodyguard", "seer", "villager"] as const;
    let match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, cupid: 1, bodyguard: 1, seer: 1, villager: 1 },
      dayDurationMinutes: 1,
    }, () => 0.5);
    match.players = match.players.map((player, index) => ({
      ...player,
      role: roles[index],
    }));

    match = startMatch(match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: players[4].id,
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: players[4].id,
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: players[0].id,
    });
    match = continueAfterSeerResult(match);
    match = submitNightCall(match, "cupid", {
      kind: "cupid-link",
      firstTargetId: players[1].id,
      secondTargetId: players[4].id,
    });
    match = resolveNight(match).match;

    await saveGameAndMatch(game, match);
    assert.deepEqual(await getMatch(game.id), match);
    const backup = await createBackup();
    assert.deepEqual(
      backup.games.find((entry) => entry.game.id === game.id)?.match,
      match,
    );
    assert.equal(await importBackup(backup), 1);
    assert.deepEqual(await getMatch(game.id), match);
    await deleteGame(game.id);
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

  it("exports and imports complete backups while merging matching game ids", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `backup-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "backup-game",
      name: "Partida exportada",
      players,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const match = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
      dayDurationMinutes: 5,
    }, () => 0.5);
    const legacyGame = createGame({
      id: "backup-legacy",
      name: "Cadastro sem progresso",
      players,
      createdAt: "2026-01-02T00:00:00.000Z",
    });
    await saveGameAndMatch(game, match);
    await saveGame(legacyGame);

    const backup = await createBackup();
    assert.equal(backup.format, "werewolf-god-backup");
    assert.equal(backup.games.length, 2);
    assert.deepEqual(backup.games.find((entry) => entry.game.id === game.id)?.match, match);
    assert.equal(backup.games.find((entry) => entry.game.id === legacyGame.id)?.match, undefined);

    const replacedGame = { ...game, name: "Versão local divergente" };
    const unrelatedGame = createGame({
      id: "backup-unrelated",
      name: "Partida não substituída",
      players,
      createdAt: "2026-01-03T00:00:00.000Z",
    });
    await saveGameAndMatch(replacedGame, { ...match, name: replacedGame.name });
    await saveGameAndMatch(legacyGame, createMatch({
      id: legacyGame.id,
      name: legacyGame.name,
      players,
      roleCounts: { werewolf: 1, villager: 4 },
      dayDurationMinutes: 5,
    }, () => 0.5));
    await saveGame(unrelatedGame);

    assert.equal(await importBackup(backup), 2);
    assert.equal((await listGames()).find((saved) => saved.id === game.id)?.name, game.name);
    assert.deepEqual(await getMatch(game.id), match);
    assert.equal(await getMatch(legacyGame.id), undefined);
    assert.ok((await listGames()).some((saved) => saved.id === unrelatedGame.id));

    await deleteGame(game.id);
    await deleteGame(legacyGame.id);
    await deleteGame(unrelatedGame.id);
  });

  it("rejects invalid backups before changing local data", async () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `invalid-backup-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    }));
    const game = createGame({
      id: "invalid-backup-local",
      name: "Partida local preservada",
      players,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await saveGame(game);
    const invalidBackup = {
      format: "werewolf-god-backup",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      games: [{ game }, { game }],
    };

    await assert.rejects(importBackup(invalidBackup), /inválidas, duplicadas ou incompatíveis/);
    const validMatch = createMatch({
      id: game.id,
      name: game.name,
      players,
      roleCounts: { werewolf: 1, villager: 4 },
      dayDurationMinutes: 5,
    });
    const duplicateRevealersMatch: MatchState = {
      ...validMatch,
      players: validMatch.players.map((player, index) =>
        index < 2 ? { ...player, role: "revealer" } : player,
      ),
    };
    await assert.rejects(
      importBackup({
        ...invalidBackup,
        games: [{ game, match: duplicateRevealersMatch }],
      }),
      /inválidas, duplicadas ou incompatíveis/,
    );
    const duplicateHookersMatch: MatchState = {
      ...validMatch,
      players: validMatch.players.map((player, index) =>
        index < 2 ? { ...player, role: "hooker" } : player,
      ),
    };
    await assert.rejects(
      importBackup({
        ...invalidBackup,
        games: [{ game, match: duplicateHookersMatch }],
      }),
      /inválidas, duplicadas ou incompatíveis/,
    );
    assert.deepEqual(await listGames(), [game]);
    await deleteGame(game.id);
  });
});
