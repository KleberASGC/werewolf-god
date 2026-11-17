import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMatch } from "./match-setup";
import {
  endDiscussion,
  pauseDiscussion,
  recordVote,
  resumeDiscussion,
  reviseNightAction,
  resolveNight,
  resolveVoting,
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
): MatchState {
  let current = startMatch(match);
  const schedule = [...current.night!.schedule];
  for (const role of schedule) {
    current = submitNightCall(current, role, actions[role]);
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

    assert.equal(match.phase, "night-resolution");
    assert.equal(match.night?.actions.some((record) => record.role === "witch"), false);
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
