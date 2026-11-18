import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMatch, type PlayerInput } from "./match-setup";

function players(count: number): PlayerInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
  }));
}

describe("createMatch", () => {
  it("creates a 5-player match with one role per player", () => {
    const match = createMatch(
      {
        id: "match-1",
        name: "  First game  ",
        players: players(5),
        roleCounts: {
          werewolf: 1,
          bodyguard: 1,
          witch: 1,
          seer: 1,
          villager: 1,
        },
        dayDurationMinutes: 5,
      },
      () => 0,
    );

    assert.equal(match.name, "First game");
    assert.equal(match.players.length, 5);
    assert.equal(new Set(match.players.map((player) => player.role)).size, 5);
    assert.equal(match.phase, "prepared");
  });

  it("accepts the configured player-count boundaries", () => {
    const make = (count: number) =>
      createMatch(
        {
          id: `match-${count}`,
          name: "Boundary game",
          players: players(count),
          roleCounts: { werewolf: 1, villager: count - 1 },
          dayDurationMinutes: 1,
        },
        () => 0.5,
      );

    assert.equal(make(5).players.length, 5);
    assert.equal(make(75).players.length, 75);
  });

  it("includes Lycan in the role draw without counting it as a Werewolf", () => {
    const match = createMatch(
      {
        id: "match-lycan",
        name: "Lycan game",
        players: players(5),
        roleCounts: { werewolf: 1, seer: 1, lycan: 1, villager: 2 },
        dayDurationMinutes: 5,
      },
      () => 0,
    );

    assert.deepEqual(
      match.players.map((player) => player.role).sort(),
      ["lycan", "seer", "villager", "villager", "werewolf"],
    );
    assert.equal(match.rulesetId, "werewolf-god-v1");
  });

  it("allows one Cursed and rejects a composition with multiple Cursed cards", () => {
    const match = createMatch(
      {
        id: "match-cursed",
        name: "Cursed game",
        players: players(5),
        roleCounts: { werewolf: 1, cursed: 1, villager: 3 },
        dayDurationMinutes: 5,
      },
      () => 0,
    );

    assert.equal(match.players.filter((player) => player.role === "cursed").length, 1);
    assert.throws(
      () =>
        createMatch(
          {
            id: "match-multiple-cursed",
            name: "Multiple Cursed",
            players: players(5),
            roleCounts: { werewolf: 1, cursed: 2, villager: 2 },
            dayDurationMinutes: 5,
          },
          () => 0,
        ),
      /no máximo um Amaldiçoado/,
    );
  });

  it("rejects invalid player counts and role compositions", () => {
    const base = {
      id: "match-1",
      name: "Invalid game",
      roleCounts: { werewolf: 1, villager: 4 },
      dayDurationMinutes: 5,
    };

    assert.throws(() => createMatch({ ...base, players: players(4) }, () => 0), /entre 5 e 75/);
    assert.throws(() => createMatch({ ...base, players: players(76) }, () => 0), /entre 5 e 75/);
    assert.throws(
      () =>
        createMatch(
          {
            ...base,
            players: players(5),
            roleCounts: { werewolf: 0, villager: 5 },
          },
          () => 0,
        ),
      /ao menos um Lobisomem/,
    );
    assert.throws(
      () =>
        createMatch(
          {
            ...base,
            players: players(5),
            roleCounts: { werewolf: 3, villager: 2 },
          },
          () => 0,
        ),
      /mais jogadores não Lobisomens/,
    );
    assert.throws(
      () =>
        createMatch(
          {
            ...base,
            players: players(5),
            roleCounts: { werewolf: 1, villager: 3 },
          },
          () => 0,
        ),
      /igual à quantidade de jogadores/,
    );
  });

  it("rejects invalid discussion durations and duplicate player ids", () => {
    assert.throws(
      () =>
        createMatch(
          {
            id: "match-1",
            name: "Invalid duration",
            players: players(5),
            roleCounts: { werewolf: 1, villager: 4 },
            dayDurationMinutes: 11,
          },
          () => 0,
        ),
      /entre 1 e 10/,
    );

    const duplicateIds = players(5);
    duplicateIds[1].id = duplicateIds[0].id;
    assert.throws(
      () =>
        createMatch(
          {
            id: "match-1",
            name: "Duplicate ids",
            players: duplicateIds,
            roleCounts: { werewolf: 1, villager: 4 },
            dayDurationMinutes: 5,
          },
          () => 0,
        ),
      /identificador único/,
    );
  });
});
