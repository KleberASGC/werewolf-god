import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMatch } from "./match-setup";
import {
  awakenCursed,
  continueAfterSeerResult,
  endDiscussion,
  isVotingDecided,
  pauseDiscussion,
  recordVote,
  resumeDiscussion,
  reviseNightAction,
  resolveNight,
  resolveVoting,
  skipVoting,
  startDiscussion,
  startMatch,
  startNextNight,
  startVoting,
  submitNightCall,
  updateDiscussionClock,
} from "./match-engine";
import type {
  MatchPlayer,
  MatchState,
  NightAction,
  VoteChoice,
} from "./match";
import type { NightRole, RoleId } from "./ruleset-v1";

const defaultRoles: RoleId[] = [
  "werewolf",
  "bodyguard",
  "witch",
  "seer",
  "villager",
];

function createFixture(roles: RoleId[] = defaultRoles): MatchState {
  const players = roles.map((_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
  }));
  const roleCounts = roles.reduce<Partial<Record<RoleId, number>>>((counts, role) => {
    counts[role] = (counts[role] ?? 0) + 1;
    return counts;
  }, {});
  const match = createMatch(
    {
      id: "match-1",
      name: "Test match",
      players,
      roleCounts,
      dayDurationMinutes: 1,
    },
    () => 0.5,
  );

  return {
    ...match,
    players: players.map<MatchPlayer>((player, index) => ({
      ...player,
      role: roles[index],
      status: "alive",
    })),
  };
}

function recordNight(
  match: MatchState,
  actions: Partial<Record<NightRole, NightAction>> = {},
  pauseAfterSeerResult = false,
): MatchState {
  let current = startMatch(match);
  const schedule = [...current.night!.schedule];
  for (const role of schedule) {
    if (current.phase === "seer-result") {
      current = continueAfterSeerResult(current);
    }
    current = submitNightCall(current, role, actions[role]);
  }
  if (!pauseAfterSeerResult && current.phase === "seer-result") {
    current = continueAfterSeerResult(current);
  }
  return current;
}

function resolveQuietNight(match: MatchState, killPlayerId?: string): MatchState {
  const noDeathTarget = killPlayerId ?? "player-5";
  const actions: Partial<Record<NightRole, NightAction>> = {
    werewolf: { kind: "werewolf-attack", targetId: noDeathTarget },
    bodyguard: {
      kind: "bodyguard-protect",
      targetId: killPlayerId ? "player-2" : noDeathTarget,
    },
    seer: { kind: "seer-investigate", targetId: "player-2" },
  };
  return resolveNight(recordNight(match, actions)).match;
}

function enterVoting(match: MatchState): MatchState {
  const dawn = resolveQuietNight(match);
  const discussion = startDiscussion(dawn, 10_000);
  const endedDiscussion = endDiscussion(discussion, 10_000);
  return startVoting(endedDiscussion, () => 0.5);
}

function castAllVotes(
  match: MatchState,
  choiceForVoter: (voterId: string, index: number, order: string[]) => VoteChoice,
): MatchState {
  let current = match;
  const order = [...match.voting!.order];
  order.forEach((voterId, index) => {
    current = recordVote(current, voterId, choiceForVoter(voterId, index, order));
  });
  return current;
}

function otherPlayerChoice(match: MatchState, voterId: string): VoteChoice {
  const target = match.players.find(
    (player) => player.status === "alive" && player.id !== voterId,
  );
  if (!target) throw new Error("Fixture requires another living player.");
  return { kind: "player", playerId: target.id };
}

describe("night flow and resolution", () => {
  it("calls Cupido only on the first night and persists a distinct selected pair", () => {
    const fixture = createFixture(["werewolf", "cupid", "bodyguard", "seer", "villager"]);
    const started = startMatch(fixture);
    assert.deepEqual(started.night?.schedule, [
      "werewolf",
      "bodyguard",
      "seer",
      "cupid",
    ]);

    let pending = submitNightCall(started, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    pending = submitNightCall(pending, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-4",
    });
    pending = submitNightCall(pending, "seer", {
      kind: "seer-investigate",
      targetId: "player-1",
    });
    pending = continueAfterSeerResult(pending);
    assert.throws(() => submitNightCall(pending, "cupid"), /precisa registrar sua ação/);
    assert.throws(
      () => submitNightCall(pending, "cupid", {
        kind: "cupid-link",
        firstTargetId: "player-2",
        secondTargetId: "player-2",
      }),
      /dois jogadores diferentes/,
    );
    pending = submitNightCall(pending, "cupid", {
      kind: "cupid-link",
      firstTargetId: "player-2",
      secondTargetId: "player-5",
    });

    const firstNight = resolveNight(pending).match;
    assert.deepEqual(firstNight.cupidLinkedPlayerIds, ["player-2", "player-5"]);
    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const filledVotes = castAllVotes(voting, () => ({ kind: "annul" }));
    const nextNight = startNextNight(resolveVoting(filledVotes).match);
    assert.equal(nextNight.night?.schedule.includes("cupid"), false);
  });

  it("does not eliminate a connected pair when the attacked member is protected", () => {
    const result = resolveNight(recordNight(
      createFixture(["werewolf", "cupid", "bodyguard", "seer", "villager"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-5" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-5" },
        seer: { kind: "seer-investigate", targetId: "player-1" },
        cupid: {
          kind: "cupid-link",
          firstTargetId: "player-5",
          secondTargetId: "player-4",
        },
      },
    ));

    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.deepEqual(result.blockedAttackTargetIds, ["player-5"]);
  });

  it("eliminates an unprotected connected player but spares a protected partner", () => {
    const result = resolveNight(recordNight(
      createFixture(["werewolf", "cupid", "bodyguard", "seer", "villager"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-5" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
        seer: { kind: "seer-investigate", targetId: "player-1" },
        cupid: {
          kind: "cupid-link",
          firstTargetId: "player-5",
          secondTargetId: "player-4",
        },
      },
    ));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5"]);
    assert.equal(result.match.players.find((player) => player.id === "player-4")?.status, "alive");
  });

  it("eliminates both connected players when an unprotected attack kills one", () => {
    const result = resolveNight(recordNight(
      createFixture(["werewolf", "cupid", "bodyguard", "seer", "villager"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-5" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-1" },
        seer: { kind: "seer-investigate", targetId: "player-1" },
        cupid: {
          kind: "cupid-link",
          firstTargetId: "player-5",
          secondTargetId: "player-4",
        },
      },
    ));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5", "player-4"]);
  });

  it("eliminates an unprotected partner and cancels a Cursed conversion", () => {
    const result = resolveNight(recordNight(
      createFixture(["werewolf", "cursed", "witch", "bodyguard", "cupid"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-2" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
        witch: { kind: "witch", eliminateTargetId: "player-5" },
        cupid: {
          kind: "cupid-link",
          firstTargetId: "player-2",
          secondTargetId: "player-5",
        },
      },
    ));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5", "player-2"]);
    assert.deepEqual(result.pendingCursedConversionPlayerIds, []);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "dead");
  });

  it("keeps the connected partner alive while the Cursed conversion is pending", () => {
    const result = resolveNight(recordNight(
      createFixture(["werewolf", "cursed", "cupid", "bodyguard", "seer"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-2" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
        seer: { kind: "seer-investigate", targetId: "player-1" },
        cupid: {
          kind: "cupid-link",
          firstTargetId: "player-2",
          secondTargetId: "player-3",
        },
      },
    ));

    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.deepEqual(result.pendingCursedConversionPlayerIds, ["player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "alive");
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.status, "alive");
  });

  it("cancels a pending Cursed conversion when the connected partner is exiled", () => {
    const fixture = createFixture(["werewolf", "cursed", "cupid", "bodyguard", "seer"]);
    const firstNight = resolveNight(recordNight(fixture, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-1" },
      cupid: {
        kind: "cupid-link",
        firstTargetId: "player-2",
        secondTargetId: "player-3",
      },
    })).match;
    assert.equal(firstNight.players.find((player) => player.id === "player-2")?.pendingCursedConversion, true);

    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const filledVotes = castAllVotes(voting, (voterId) =>
      voterId === "player-3"
        ? { kind: "player", playerId: "player-2" }
        : { kind: "player", playerId: "player-3" },
    );
    const result = resolveVoting(filledVotes);

    assert.equal(result.exiledPlayerId, "player-3");
    assert.deepEqual(result.linkedEliminatedPlayerIds, ["player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "dead");
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.pendingCursedConversion, undefined);
  });

  it("keeps the Cupid bond after the Cursed awakens and eliminates both connected players", () => {
    const fixture = createFixture([
      "werewolf",
      "cursed",
      "cupid",
      "bodyguard",
      "seer",
      "villager",
    ]);
    const firstNight = resolveNight(recordNight(fixture, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-1" },
      cupid: {
        kind: "cupid-link",
        firstTargetId: "player-2",
        secondTargetId: "player-6",
      },
    })).match;
    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const noExile = castAllVotes(voting, () => ({ kind: "annul" }));
    const nextNight = awakenCursed(startNextNight(resolveVoting(noExile).match));

    let pending = submitNightCall(nextNight, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-6",
    });
    pending = submitNightCall(pending, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-5",
    });
    pending = submitNightCall(pending, "seer", {
      kind: "seer-investigate",
      targetId: "player-1",
    });
    pending = continueAfterSeerResult(pending);
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-6", "player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.role, "werewolf");
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "dead");
    assert.equal(result.match.players.find((player) => player.id === "player-6")?.status, "dead");
  });

  it("eliminates the connected partner after an exile and checks victory afterward", () => {
    const fixture = createFixture([
      "werewolf",
      "werewolf",
      "cupid",
      "villager",
      "villager",
      "bodyguard",
    ]);
    const firstNight = resolveNight(recordNight(fixture, {
      werewolf: { kind: "werewolf-attack", targetId: "player-4" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      cupid: {
        kind: "cupid-link",
        firstTargetId: "player-3",
        secondTargetId: "player-5",
      },
    })).match;
    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const filledVotes = castAllVotes(voting, (voterId) =>
      voterId === "player-3"
        ? { kind: "player", playerId: "player-5" }
        : { kind: "player", playerId: "player-3" },
    );
    const result = resolveVoting(filledVotes);

    assert.equal(result.exiledPlayerId, "player-3");
    assert.deepEqual(result.linkedEliminatedPlayerIds, ["player-5"]);
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.status, "exiled");
    assert.equal(result.match.players.find((player) => player.id === "player-5")?.status, "dead");
    assert.equal(result.winner, "werewolves");
  });

  it("calls the optional Denunciador after the Seer and allows skipping the action", () => {
    const match = createFixture(["werewolf", "seer", "revealer", "spellcaster", "villager"]);
    const started = startMatch(match);

    assert.deepEqual(started.night?.schedule, ["werewolf", "seer", "revealer", "spellcaster"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-3" },
      spellcaster: { kind: "spellcaster-silence", targetId: "player-5" },
    });

    assert.equal(pending.phase, "night-resolution");
    assert.equal(pending.night?.actions.some((record) => record.role === "revealer"), false);

    const eliminatedRevealer = {
      ...match,
      players: match.players.map((player) =>
        player.role === "revealer" ? { ...player, status: "dead" as const } : player,
      ),
    };
    const afterElimination = recordNight(eliminatedRevealer, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      spellcaster: { kind: "spellcaster-silence", targetId: "player-5" },
    });
    assert.ok(afterElimination.night?.schedule.includes("revealer"));
    assert.equal(afterElimination.night?.actions.some((record) => record.role === "revealer"), false);
  });

  it("calls the optional Quenga after the Conjurador and accepts no choice", () => {
    const match = createFixture(["werewolf", "hooker", "spellcaster", "seer", "villager"]);
    const started = startMatch(match);

    assert.deepEqual(started.night?.schedule, ["werewolf", "seer", "spellcaster", "hooker"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
      spellcaster: { kind: "spellcaster-silence", targetId: "player-5" },
    });

    assert.equal(pending.phase, "night-resolution");
    assert.equal(pending.night?.actions.some((record) => record.role === "hooker"), false);

    const eliminatedQuenga = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    eliminatedQuenga.players[1].status = "dead";
    const afterElimination = recordNight(eliminatedQuenga, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
    });
    assert.ok(afterElimination.night?.schedule.includes("hooker"));
    assert.equal(afterElimination.night?.actions.some((record) => record.role === "hooker"), false);
  });

  it("rejects a Quenga choosing herself and allows removing her optional choice in review", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    let pending = startMatch(match);
    pending = submitNightCall(pending, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    pending = submitNightCall(pending, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-4",
    });
    pending = submitNightCall(pending, "seer", {
      kind: "seer-investigate",
      targetId: "player-5",
    });
    pending = continueAfterSeerResult(pending);
    assert.throws(
      () => submitNightCall(pending, "hooker", {
        kind: "hooker-sleep",
        targetId: "player-2",
      }),
      /não pode escolher a si mesma/,
    );
    pending = submitNightCall(pending, "hooker", {
      kind: "hooker-sleep",
      targetId: "player-5",
    });

    const revised = reviseNightAction(pending, "hooker");
    assert.equal(revised.night?.actions.some((record) => record.role === "hooker"), false);
  });

  it("evades a Werewolf attack on the Quenga when she sleeps with a non-Werewolf", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.deepEqual(result.blockedAttackTargetIds, []);
    assert.deepEqual(result.publicAnnouncement, { kind: "no-deaths" });
  });

  it("is eliminated by a Werewolf attack when she stays home", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
    }));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-2"]);
  });

  it("eliminates the Quenga for sleeping with a Werewolf unless she is protected", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-1" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "alive");
  });

  it("eliminates the Quenga even when her companion is protected from the Werewolves", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-5")?.status, "alive");
  });

  it("eliminates both the Quenga and an unprotected companion attacked by Werewolves", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    }));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5", "player-2"]);
  });

  it("protecting the Quenga does not protect the companion attacked by Werewolves", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "seer", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "alive");
  });

  it("protecting both the Quenga and her companion blocks both eliminations", () => {
    const match = createFixture(["werewolf", "hooker", "bodyguard", "witch", "villager"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-5" },
      witch: { kind: "witch", protectTargetId: "player-2" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    }));

    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.deepEqual(result.blockedAttackTargetIds, ["player-5"]);
    assert.deepEqual(result.protectedPlayerIds, ["player-5", "player-2"]);
  });

  it("does not transfer a non-Werewolf elimination against the Quenga's companion", () => {
    const match = createFixture(["werewolf", "hooker", "witch", "seer", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-4" },
      witch: { kind: "witch", eliminateTargetId: "player-5" },
      seer: { kind: "seer-investigate", targetId: "player-5" },
      hooker: { kind: "hooker-sleep", targetId: "player-5" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-4", "player-5"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "alive");
  });

  it("keeps the Cursed alive with pending conversion when the Quenga dies beside him", () => {
    const match = createFixture(["werewolf", "hooker", "cursed", "bodyguard", "seer"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-3" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-3" },
      hooker: { kind: "hooker-sleep", targetId: "player-3" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-2"]);
    assert.deepEqual(result.pendingCursedConversionPlayerIds, ["player-3"]);
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.status, "alive");
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.pendingCursedConversion, true);
  });

  it("cancels the Cursed conversion when the Quenga and her Cupid-linked companion die", () => {
    const match = createFixture(["werewolf", "hooker", "cursed", "cupid", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-3" },
      cupid: {
        kind: "cupid-link",
        firstTargetId: "player-2",
        secondTargetId: "player-3",
      },
      hooker: { kind: "hooker-sleep", targetId: "player-3" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-2", "player-3"]);
    assert.deepEqual(result.pendingCursedConversionPlayerIds, []);
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.status, "dead");
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.pendingCursedConversion, undefined);
  });

  it("eliminates an unprotected Werewolf denounced by the Denunciador", () => {
    const match = createFixture(["werewolf", "revealer", "bodyguard", "witch", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      revealer: { kind: "revealer-denounce", targetId: "player-1" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5", "player-1"]);
    assert.equal(result.winner, "villagers");
  });

  it("blocks a Denunciador's correct accusation when the Werewolf is protected", () => {
    const match = createFixture(["werewolf", "revealer", "bodyguard", "witch", "villager"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-1" },
      revealer: { kind: "revealer-denounce", targetId: "player-1" },
    }));

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5"]);
    assert.deepEqual(result.blockedAttackTargetIds, ["player-1"]);
  });

  it("treats a Lycan as a non-Werewolf and protects the Denunciador from a false accusation", () => {
    const match = createFixture(["werewolf", "revealer", "bodyguard", "lycan", "villager"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      revealer: { kind: "revealer-denounce", targetId: "player-4" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, ["player-5"]);
    assert.deepEqual(result.blockedAttackTargetIds, ["player-2"]);
  });

  it("rejects self-denunciation and allows removing an optional action in review", () => {
    const match = createFixture(["werewolf", "revealer", "bodyguard", "witch", "villager"]);
    let pending = startMatch(match);
    pending = submitNightCall(pending, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    pending = submitNightCall(pending, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-4",
    });
    pending = submitNightCall(pending, "witch");
    assert.throws(
      () => submitNightCall(pending, "revealer", {
        kind: "revealer-denounce",
        targetId: "player-2",
      }),
      /não pode escolher a si mesmo/,
    );
    pending = submitNightCall(pending, "revealer", {
      kind: "revealer-denounce",
      targetId: "player-1",
    });
    const revised = reviseNightAction(pending, "revealer");

    assert.equal(revised.night?.actions.some((record) => record.role === "revealer"), false);
  });

  it("calls configured night roles in order and resolves attacks with protection", () => {
    const fixture = createFixture();
    const pending = recordNight(fixture, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-5" },
      witch: {
        kind: "witch",
        protectTargetId: "player-2",
        eliminateTargetId: "player-5",
      },
      seer: { kind: "seer-investigate", targetId: "player-1" },
    });

    assert.equal(pending.phase, "night-resolution");
    const result = resolveNight(pending);

    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.deepEqual(result.blockedAttackTargetIds, ["player-5"]);
    assert.deepEqual(result.investigations, [{ targetId: "player-1", isWerewolf: true }]);
    assert.deepEqual(result.publicAnnouncement, { kind: "no-deaths" });
    assert.deepEqual(result.match.witchResources, {
      protectionUsed: true,
      eliminationUsed: true,
    });
  });

  it("calls a configured night role even after all its players are eliminated", () => {
    const fixture = createFixture().players.map((player) =>
      player.role === "witch" ? { ...player, status: "dead" as const } : player,
    );
    let match = startMatch({ ...createFixture(), players: fixture });

    assert.ok(match.night?.schedule.includes("witch"));
    for (const role of [...match.night!.schedule]) {
      const action: Partial<Record<NightRole, NightAction>> = {
        werewolf: { kind: "werewolf-attack", targetId: "player-5" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
        seer: { kind: "seer-investigate", targetId: "player-2" },
      };
      match = submitNightCall(match, role, action[role]);
    }

    assert.equal(match.night?.actions.some((record) => record.role === "witch"), false);
    if (match.phase === "seer-result") {
      match = continueAfterSeerResult(match);
    }
    assert.equal(match.phase, "night-resolution");
  });

  it("does not schedule roles absent from the initial composition", () => {
    const match = startMatch(
      createFixture(["werewolf", "villager", "villager", "villager", "villager"]),
    );

    assert.deepEqual(match.night?.schedule, ["werewolf"]);
    assert.equal(
      submitNightCall(match, "werewolf", {
        kind: "werewolf-attack",
        targetId: "player-2",
      }).phase,
      "night-resolution",
    );
  });

  it("rejects invalid targets and preserves the previous bodyguard target rule", () => {
    let match = startMatch(createFixture());

    assert.throws(
      () =>
      submitNightCall(match, "werewolf", {
        kind: "werewolf-attack",
        targetId: "player-1",
      }),
      /não podem escolher outro Lobisomem/,
    );
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    assert.doesNotThrow(() =>
      submitNightCall(match, "bodyguard", {
        kind: "bodyguard-protect",
        targetId: "player-5",
      }),
    );
  });

  it("allows reviewing actions before confirming a night", () => {
    const pending = recordNight(createFixture(), {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    });
    const revised = reviseNightAction(pending, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-4",
    });
    assert.deepEqual(revised.night?.actions.find((record) => record.role === "werewolf")?.action, {
      kind: "werewolf-attack",
      targetId: "player-4",
    });
  });

  it("shows the seer result before night review and does not allow revising it", () => {
    const result = recordNight(createFixture(), {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-1" },
    }, true);

    assert.equal(result.phase, "seer-result");
    assert.throws(
      () => reviseNightAction(result, "seer", {
        kind: "seer-investigate",
        targetId: "player-2",
      }),
      /não pode ser revisada/,
    );
    assert.equal(continueAfterSeerResult(result).phase, "night-resolution");
  });

  it("shows Lycan as a Werewolf to the Seer without scheduling a Lycan action", () => {
    const match = createFixture(["werewolf", "seer", "lycan", "villager", "villager"]);
    const started = startMatch(match);
    assert.deepEqual(started.night?.schedule, ["werewolf", "seer"]);

    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-3" },
    });
    const result = resolveNight(pending);

    assert.deepEqual(result.investigations, [{ targetId: "player-3", isWerewolf: true }]);
    assert.equal(result.match.players.find((player) => player.id === "player-3")?.status, "alive");
  });

  it("marks an unprotected Cursed conversion as pending after the Seer investigates", () => {
    const match = createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    });

    const result = resolveNight(pending);
    const cursed = result.match.players.find((player) => player.id === "player-2");

    assert.deepEqual(result.investigations, [{ targetId: "player-2", isWerewolf: false }]);
    assert.deepEqual(result.convertedPlayerIds, []);
    assert.deepEqual(result.pendingCursedConversionPlayerIds, ["player-2"]);
    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.equal(cursed?.role, "cursed");
    assert.equal(cursed?.pendingCursedConversion, true);
    assert.equal(cursed?.convertedFromCursed, undefined);
    assert.equal(cursed?.status, "alive");
    assert.deepEqual(result.match.history.at(-1), {
      type: "night-resolved",
      round: 1,
      actions: pending.night?.actions,
      eliminatedPlayerIds: [],
      pendingCursedConversionPlayerIds: ["player-2"],
      protectedPlayerIds: ["player-3"],
      blockedAttackTargetIds: [],
      investigations: [{ targetId: "player-2", isWerewolf: false }],
    });
  });

  it("does not convert a protected Cursed", () => {
    const match = createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
      witch: { kind: "witch", protectTargetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    }));

    assert.deepEqual(result.convertedPlayerIds, []);
    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.role, "cursed");
    assert.deepEqual(result.blockedAttackTargetIds, ["player-2"]);
    assert.equal(result.match.witchResources.protectionUsed, true);
  });

  it("does not convert a Cursed protected by the Bodyguard", () => {
    const match = createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    }));

    assert.deepEqual(result.convertedPlayerIds, []);
    assert.deepEqual(result.eliminatedPlayerIds, []);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.role, "cursed");
  });

  it("shows a converted Cursed as a Werewolf to the Seer on the following night", () => {
    const firstNight = resolveNight(recordNight(
      createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-2" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
        seer: { kind: "seer-investigate", targetId: "player-2" },
      },
    )).match;
    const discussion = endDiscussion(startDiscussion(firstNight, 0), 0);
    const voting = startVoting(discussion, () => 0.5);
    const filledVotes = castAllVotes(voting, () => ({ kind: "annul" }));
    const nextNight = startNextNight(resolveVoting(filledVotes).match);
    assert.equal(nextNight.night?.awakeningRequired, true);
    assert.equal(nextNight.players.find((player) => player.id === "player-2")?.role, "cursed");
    assert.throws(
      () => submitNightCall(nextNight, "werewolf", {
        kind: "werewolf-attack",
        targetId: "player-4",
      }),
      /deve ser despertado discretamente/,
    );
    const awakened = awakenCursed(nextNight);
    assert.equal(awakened.players.find((player) => player.id === "player-2")?.role, "werewolf");
    let pending = submitNightCall(awakened, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-3",
    });
    pending = submitNightCall(pending, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-4",
    });
    pending = submitNightCall(pending, "witch");
    pending = submitNightCall(pending, "seer", {
      kind: "seer-investigate",
      targetId: "player-2",
    });
    pending = continueAfterSeerResult(pending);

    assert.deepEqual(resolveNight(pending).investigations, [
      { targetId: "player-2", isWerewolf: true },
    ]);
  });

  it("eliminates rather than converts a Cursed attacked by both the Wolves and Witch", () => {
    const match = createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
      witch: { kind: "witch", eliminateTargetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    }));

    assert.deepEqual(result.convertedPlayerIds, []);
    assert.deepEqual(result.eliminatedPlayerIds, ["player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.role, "cursed");
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "dead");
    assert.deepEqual(result.investigations, [{ targetId: "player-2", isWerewolf: false }]);
  });

  it("eliminates a Cursed targeted only by the Witch without converting", () => {
    const match = createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]);
    const result = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-5" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
      witch: { kind: "witch", eliminateTargetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-2" },
    }));

    assert.deepEqual(result.convertedPlayerIds, []);
    assert.deepEqual(result.eliminatedPlayerIds, ["player-5", "player-2"]);
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.role, "cursed");
    assert.equal(result.match.players.find((player) => player.id === "player-2")?.status, "dead");
  });

  it("counts a Cursed as Werewolf only after discreet awakening", () => {
    const match = createFixture(["werewolf", "werewolf", "cursed", "bodyguard", "seer"]);
    const firstNight = resolveNight(recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-3" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-4" },
      seer: { kind: "seer-investigate", targetId: "player-3" },
    })).match;
    assert.equal(firstNight.phase, "dawn");
    assert.equal(firstNight.players.find((player) => player.id === "player-3")?.role, "cursed");

    const discussion = endDiscussion(startDiscussion(firstNight, 0), 0);
    const voting = startVoting(discussion, () => 0.5);
    const filledVotes = castAllVotes(voting, () => ({ kind: "annul" }));
    const nextNight = awakenCursed(startNextNight(resolveVoting(filledVotes).match));
    assert.equal(nextNight.players.filter((player) => player.status === "alive" && player.role === "werewolf").length, 3);
    assert.equal(nextNight.phase, "night");
  });

  it("continues after the last Werewolf is exiled while a Cursed awaits awakening", () => {
    const firstNight = resolveNight(recordNight(
      createFixture(["werewolf", "cursed", "bodyguard", "witch", "seer"]),
      {
        werewolf: { kind: "werewolf-attack", targetId: "player-2" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-3" },
        seer: { kind: "seer-investigate", targetId: "player-2" },
      },
    )).match;
    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const werewolfId = "player-1";
    const filledVotes = castAllVotes(voting, (voterId) =>
      voterId === werewolfId
        ? { kind: "player", playerId: "player-3" }
        : { kind: "player", playerId: werewolfId },
    );
    const afterExile = resolveVoting(filledVotes);

    assert.equal(afterExile.exiledPlayerId, werewolfId);
    assert.equal(afterExile.winner, undefined);
    assert.equal(afterExile.match.phase, "ready-for-night");
    assert.equal(afterExile.match.players.find((player) => player.id === "player-2")?.pendingCursedConversion, true);

    const nextNight = startNextNight(afterExile.match);
    assert.equal(nextNight.night?.awakeningRequired, true);
    const awakened = awakenCursed(nextNight);
    assert.equal(awakened.players.find((player) => player.id === "player-2")?.role, "werewolf");
    assert.equal(awakened.players.filter((player) =>
      player.status === "alive" && player.role === "werewolf",
    ).length, 1);
    assert.equal(awakened.phase, "night");
  });

  it("calls the Conjurador after the Seer and prevents consecutive targets", () => {
    const fixture = createFixture([
      "werewolf",
      "seer",
      "spellcaster",
      "spellcaster",
      "villager",
      "villager",
    ]);
    let match = startMatch(fixture);
    assert.deepEqual(match.night?.schedule, ["werewolf", "seer", "spellcaster"]);

    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-4",
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: "player-1",
    });
    assert.equal(match.phase, "seer-result");
    match = continueAfterSeerResult(match);
    assert.throws(
      () => submitNightCall(match, "spellcaster"),
      /precisa registrar sua ação/,
    );
    match = submitNightCall(match, "spellcaster", {
      kind: "spellcaster-silence",
      targetId: "player-3",
    });
    const firstNight = resolveNight(match).match;
    assert.equal(firstNight.lastSpellcasterTargetId, "player-3");
    const firstNightHistory = firstNight.history[0];
    assert.equal(firstNightHistory.type, "night-resolved");
    if (firstNightHistory.type === "night-resolved") {
      assert.deepEqual(
        firstNightHistory.actions.find((record) => record.role === "spellcaster")?.action,
        { kind: "spellcaster-silence", targetId: "player-3" },
      );
    }

    const voting = startVoting(
      endDiscussion(startDiscussion(firstNight, 0), 0),
      () => 0.5,
    );
    const filledVotes = castAllVotes(voting, () => ({ kind: "annul" }));
    match = startNextNight(resolveVoting(filledVotes).match);
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: "player-1",
    });
    match = continueAfterSeerResult(match);
    assert.throws(
      () =>
        submitNightCall(match, "spellcaster", {
          kind: "spellcaster-silence",
          targetId: "player-4",
        }),
      /precisa estar vivo/,
    );
    assert.throws(
      () =>
        submitNightCall(match, "spellcaster", {
          kind: "spellcaster-silence",
          targetId: "player-3",
        }),
      /não pode repetir o alvo em dias consecutivos/,
    );
    assert.doesNotThrow(() =>
      submitNightCall(match, "spellcaster", {
        kind: "spellcaster-silence",
        targetId: "player-2",
      }),
    );
  });

  it("keeps the Conjurador call but records no action when all copies are eliminated", () => {
    const fixture = createFixture([
      "werewolf",
      "bodyguard",
      "seer",
      "spellcaster",
      "villager",
    ]);
    const players = fixture.players.map((player) =>
      player.role === "spellcaster" ? { ...player, status: "dead" as const } : player,
    );
    let match = startMatch({ ...fixture, players });

    assert.ok(match.night?.schedule.includes("spellcaster"));
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-2",
    });
    match = submitNightCall(match, "seer", {
      kind: "seer-investigate",
      targetId: "player-1",
    });
    match = continueAfterSeerResult(match);
    match = submitNightCall(match, "spellcaster");
    assert.equal(match.phase, "night-resolution");
    assert.equal(match.night?.actions.some((record) => record.role === "spellcaster"), false);
  });

  it("does not allow the guard group to repeat its previous target", () => {
    const firstNight = resolveQuietNight(createFixture());
    const discussion = endDiscussion(startDiscussion(firstNight, 0), 0);
    const voting = startVoting(discussion, () => 0.5);
    const filledVotes = castAllVotes(voting, () => ({ kind: "annul" }));
    const nextNight = startNextNight(resolveVoting(filledVotes).match);
    const afterWolves = submitNightCall(nextNight, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-4",
    });

    assert.throws(
      () =>
      submitNightCall(afterWolves, "bodyguard", {
        kind: "bodyguard-protect",
        targetId: "player-5",
      }),
      /não pode repetir o alvo/,
    );
  });

  it("keeps a seer investigation even if the seer is eliminated that night", () => {
    const result = resolveNight(
      recordNight(createFixture(), {
        werewolf: { kind: "werewolf-attack", targetId: "player-4" },
        bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
        seer: { kind: "seer-investigate", targetId: "player-1" },
      }),
    );

    assert.deepEqual(result.eliminatedPlayerIds, ["player-4"]);
    assert.deepEqual(result.investigations, [{ targetId: "player-1", isWerewolf: true }]);
  });

  it("shares the witch uses across repeated role cards and allows skipping a power", () => {
    const match = createFixture(["werewolf", "bodyguard", "witch", "witch", "seer"]);
    const pending = recordNight(match, {
      werewolf: { kind: "werewolf-attack", targetId: "player-2" },
      bodyguard: { kind: "bodyguard-protect", targetId: "player-2" },
      witch: { kind: "witch", protectTargetId: "player-2" },
      seer: { kind: "seer-investigate", targetId: "player-1" },
    });

    assert.equal(pending.night?.actions.filter((record) => record.role === "witch").length, 1);
    const resolved = resolveNight(pending);
    assert.equal(resolved.match.witchResources.protectionUsed, true);
    assert.equal(resolved.match.witchResources.eliminationUsed, false);
  });

  it("prevents a group from targeting its own members when self-targeting is forbidden", () => {
    let witches = startMatch(
      createFixture(["werewolf", "bodyguard", "witch", "witch", "seer"]),
    );
    witches = submitNightCall(witches, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-2",
    });
    witches = submitNightCall(witches, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-2",
    });

    assert.throws(
      () =>
        submitNightCall(witches, "witch", {
          kind: "witch",
          eliminateTargetId: "player-4",
        }),
      /não pode eliminar alguém do próprio grupo/,
    );

    let seers = startMatch(
      createFixture(["werewolf", "bodyguard", "seer", "seer", "villager"]),
    );
    seers = submitNightCall(seers, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    seers = submitNightCall(seers, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-2",
    });

    assert.throws(
      () =>
        submitNightCall(seers, "seer", {
          kind: "seer-investigate",
          targetId: "player-4",
        }),
      /não pode investigar alguém do próprio grupo/,
    );
  });

  it("does not allow using a witch power already spent by the group", () => {
    let match = startMatch({
      ...createFixture(),
      witchResources: { protectionUsed: true, eliminationUsed: false },
    });
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-2",
    });

    assert.throws(
      () =>
        submitNightCall(match, "witch", {
          kind: "witch",
          protectTargetId: "player-2",
        }),
      /já foi gasto/,
    );
  });

  it("rejects an empty witch target instead of treating it as an unused power", () => {
    let match = startMatch(createFixture());
    match = submitNightCall(match, "werewolf", {
      kind: "werewolf-attack",
      targetId: "player-5",
    });
    match = submitNightCall(match, "bodyguard", {
      kind: "bodyguard-protect",
      targetId: "player-2",
    });

    assert.throws(
      () =>
        submitNightCall(match, "witch", {
          kind: "witch",
          protectTargetId: "",
        }),
      /não pertence à partida/,
    );
  });
});

describe("discussion and voting", () => {
  it("pauses and expires the timer without automatically starting the vote", () => {
    const discussion = startDiscussion(resolveQuietNight(createFixture()), 10_000);
    const paused = pauseDiscussion(discussion, 25_000);
    const resumed = resumeDiscussion(paused, 30_000);
    const expired = updateDiscussionClock(resumed, 90_000);

    assert.equal(paused.discussion?.remainingMs, 45_000);
    assert.equal(expired.phase, "discussion");
    assert.equal(expired.discussion?.status, "expired");
  });

  it("subtracts only the time elapsed since the previous clock update", () => {
    const fiveMinuteMatch = {
      ...resolveQuietNight(createFixture()),
      dayDurationMinutes: 5,
    };
    const discussion = startDiscussion(fiveMinuteMatch, 1_000);
    const firstTick = updateDiscussionClock(discussion, 2_000);
    const secondTick = updateDiscussionClock(firstTick, 3_000);

    assert.equal(firstTick.discussion?.remainingMs, 299_000);
    assert.equal(secondTick.discussion?.remainingMs, 298_000);
    assert.equal(secondTick.discussion?.startedAtMs, 3_000);
  });

  it("skips voting directly to the next night after discussion ends", () => {
    const discussion = endDiscussion(startDiscussion(resolveQuietNight(createFixture()), 10_000), 10_000);
    const nextNight = skipVoting(discussion);

    assert.equal(nextNight.phase, "night");
    assert.equal(nextNight.round, discussion.round + 1);
    assert.equal(nextNight.voting, undefined);
    assert.equal(nextNight.history.length, discussion.history.length);
    assert.throws(() => skipVoting(startDiscussion(resolveQuietNight(createFixture()), 10_000)));
  });

  it("resolves as soon as the voting result cannot change", () => {
    const voting = enterVoting(createFixture());
    const order = voting.voting!.order;
    const targetId = order[order.length - 1];
    let partial = voting;

    for (const voterId of order.slice(0, 3)) {
      partial = recordVote(partial, voterId, { kind: "player", playerId: targetId });
    }

    assert.equal(partial.voting!.votes.length, 3);
    assert.equal(isVotingDecided(partial), true);
    assert.equal(resolveVoting(partial).exiledPlayerId, targetId);
  });

  it("does not resolve while remaining votes could change the winner", () => {
    const voting = enterVoting(createFixture());
    const order = voting.voting!.order;
    let partial = voting;
    partial = recordVote(partial, order[0], { kind: "annul" });
    partial = recordVote(partial, order[1], { kind: "annul" });

    assert.equal(isVotingDecided(partial), false);
    assert.throws(() => resolveVoting(partial), /ainda não tem resultado definido/);
  });

  it("annuls when strictly more than half of eligible voters choose annul", () => {
    const voting = enterVoting(createFixture());
    const filled = castAllVotes(voting, (_voterId, index) =>
      index < 3 ? { kind: "annul" } : otherPlayerChoice(voting, voting.voting!.order[index]),
    );

    assert.equal(resolveVoting(filled).outcome, "annulled-majority");
  });

  it("rejects a self-vote", () => {
    const voting = enterVoting(createFixture());
    const voterId = voting.voting!.order[0];

    assert.throws(
      () => recordVote(voting, voterId, { kind: "player", playerId: voterId }),
      /não pode votar em si mesmo/,
    );
  });

  it("annuls a tie at the top, including a tie with annul", () => {
    const voting = enterVoting(createFixture());
    const order = voting.voting!.order;
    const filled = castAllVotes(voting, (_voterId, index) => {
      if (index < 2) return { kind: "annul" };
      return {
        kind: "player",
        playerId: index < 4 ? order[0] : order[1],
      };
    });

    assert.equal(resolveVoting(filled).outcome, "annulled-tie");
  });

  it("annuls a tie between two players", () => {
    const voting = enterVoting(createFixture());
    const order = voting.voting!.order;
    const targetA = order[4];
    const targetB = order[1];
    const targetC = order[0];
    const filled = castAllVotes(voting, (_voterId, index) => ({
      kind: "player",
      playerId:
        index < 2 ? targetA : index < 4 ? targetB : targetC,
    }));

    assert.equal(resolveVoting(filled).outcome, "annulled-tie");
  });

  it("does not exile anyone when annul is the unique plurality without a majority", () => {
    const fixture = createFixture();
    const seerId = fixture.players.find((player) => player.role === "seer")!.id;
    const afterDeath = resolveQuietNight(fixture, seerId);
    const discussion = endDiscussion(startDiscussion(afterDeath, 0), 0);
    const voting = startVoting(discussion, () => 0.5);
    const order = voting.voting!.order;
    const filled = castAllVotes(voting, (_voterId, index) => {
      if (index < 2) return { kind: "annul" };
      return { kind: "player", playerId: order[index - 2] };
    });

    assert.equal(order.length, 4);
    assert.equal(resolveVoting(filled).outcome, "annulled-plurality");
    assert.equal(resolveVoting(filled).exiledPlayerId, undefined);
  });

  it("exiles the top player and checks the werewolf parity condition", () => {
    const match = createFixture(["werewolf", "werewolf", "bodyguard", "seer", "witch"]);
    const voting = enterVoting(match);
    const targetId = voting.players.find((player) => player.role !== "werewolf")!.id;
    const targetVoterIndex = voting.voting!.order.indexOf(targetId);
    const filled = castAllVotes(voting, (voterId, index, order) =>
      index === targetVoterIndex
        ? { kind: "annul" }
        : { kind: "player", playerId: targetId === voterId ? order[0] : targetId },
    );
    const result = resolveVoting(filled);

    assert.equal(result.outcome, "exiled");
    assert.equal(result.exiledPlayerId, targetId);
    assert.equal(result.winner, "werewolves");
    assert.equal(result.match.phase, "finished");
  });
});
