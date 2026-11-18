import {
  appearsAsWerewolfToSeer,
  NIGHT_ROLE_ORDER,
  type NightRole,
} from "./ruleset-v1";
import { shuffleOrder, type RandomSource } from "./match-setup";
import type {
  MatchHistoryEntry,
  MatchPlayer,
  MatchState,
  NightAction,
  NightResolution,
  VoteChoice,
  VoteHistoryEntry,
  VoteResolution,
  WinningTeam,
} from "./match";

const DAY_MS = 60_000;

function assertTimestamp(timestamp: number): void {
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error("O instante informado deve ser um timestamp válido.");
  }
}

function getPlayer(match: MatchState, playerId: string): MatchPlayer {
  const player = match.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error("O jogador informado não pertence à partida.");
  }
  return player;
}

function getLivingPlayers(match: MatchState): MatchPlayer[] {
  return match.players.filter((player) => player.status === "alive");
}

function getNightSchedule(match: MatchState): NightRole[] {
  return NIGHT_ROLE_ORDER.filter((role) =>
    match.players.some((player) => player.role === role),
  );
}

function getNightRoleForAction(action: NightAction): NightRole {
  switch (action.kind) {
    case "werewolf-attack":
      return "werewolf";
    case "bodyguard-protect":
      return "bodyguard";
    case "witch":
      return "witch";
    case "seer-investigate":
      return "seer";
    case "spellcaster-silence":
      return "spellcaster";
  }
}

function validateLivingTarget(match: MatchState, targetId: string): MatchPlayer {
  const target = getPlayer(match, targetId);
  if (target.status !== "alive") {
    throw new Error("O alvo precisa estar vivo e não exilado.");
  }
  return target;
}

function validateNightAction(
  match: MatchState,
  role: NightRole,
  action: NightAction,
): void {
  if (getNightRoleForAction(action) !== role) {
    throw new Error("A ação registrada não corresponde à função chamada.");
  }

  switch (action.kind) {
    case "werewolf-attack": {
      const target = validateLivingTarget(match, action.targetId);
      if (target.role === "werewolf") {
        throw new Error("Os Lobisomens não podem escolher outro Lobisomem como alvo.");
      }
      break;
    }
    case "bodyguard-protect": {
      validateLivingTarget(match, action.targetId);
      if (action.targetId === match.lastBodyguardTargetId) {
        throw new Error("O Guarda-costas não pode repetir o alvo da noite anterior.");
      }
      break;
    }
    case "witch": {
      const protectTargetId = action.protectTargetId;
      const eliminateTargetId = action.eliminateTargetId;
      const usesProtection = protectTargetId !== undefined;
      const usesElimination = eliminateTargetId !== undefined;
      if (!usesProtection && !usesElimination) {
        throw new Error("A Bruxa precisa escolher ao menos um poder ou não registrar ação.");
      }
      if (usesProtection && match.witchResources.protectionUsed) {
        throw new Error("O uso de proteção da Bruxa já foi gasto nesta partida.");
      }
      if (usesElimination && match.witchResources.eliminationUsed) {
        throw new Error("O uso de eliminação da Bruxa já foi gasto nesta partida.");
      }
      if (usesProtection) {
        validateLivingTarget(match, protectTargetId);
      }
      if (usesElimination) {
        const target = validateLivingTarget(match, eliminateTargetId);
        if (target.role === "witch") {
          throw new Error("A Bruxa não pode eliminar alguém do próprio grupo.");
        }
      }
      if (usesProtection && protectTargetId === eliminateTargetId) {
        throw new Error("A Bruxa deve escolher alvos diferentes para os dois poderes.");
      }
      break;
    }
    case "seer-investigate": {
      const target = validateLivingTarget(match, action.targetId);
      if (target.role === "seer") {
        throw new Error("A Vidente não pode investigar alguém do próprio grupo.");
      }
      break;
    }
    case "spellcaster-silence": {
      validateLivingTarget(match, action.targetId);
      if (action.targetId === match.lastSpellcasterTargetId) {
        throw new Error("O Conjurador não pode repetir o alvo em dias consecutivos.");
      }
      break;
    }
  }
}

function hasLivingMember(match: MatchState, role: NightRole): boolean {
  return match.players.some((player) => player.role === role && player.status === "alive");
}

function determineWinner(players: MatchPlayer[]): WinningTeam | undefined {
  const living = players.filter((player) => player.status === "alive");
  const werewolves = living.filter((player) => player.role === "werewolf").length;
  const nonWerewolves = living.length - werewolves;

  if (werewolves === 0 && living.some((player) => player.pendingCursedConversion)) {
    return undefined;
  }
  if (werewolves === 0) {
    return "villagers";
  }
  if (werewolves >= nonWerewolves) {
    return "werewolves";
  }
  return undefined;
}

function appendHistory(
  history: MatchHistoryEntry[],
  entry: MatchHistoryEntry,
): MatchHistoryEntry[] {
  return [...history, entry];
}

export function startMatch(match: MatchState): MatchState {
  if (match.phase !== "prepared") {
    throw new Error("A partida já foi iniciada.");
  }

  return {
    ...match,
    phase: "night",
    round: 1,
    night: {
      schedule: getNightSchedule(match),
      nextCallIndex: 0,
      actions: [],
    },
  };
}

export function submitNightCall(
  match: MatchState,
  role: NightRole,
  action?: NightAction,
): MatchState {
  if (match.phase !== "night" || !match.night) {
    throw new Error("A partida não está aguardando uma chamada noturna.");
  }
  if (match.night.awakeningRequired) {
    throw new Error("O Amaldiçoado deve ser despertado discretamente antes da chamada dos Lobisomens.");
  }

  const expectedRole = match.night.schedule[match.night.nextCallIndex];
  if (role !== expectedRole) {
    throw new Error("As funções devem ser chamadas na ordem noturna definida.");
  }
  if (match.night.actions.some((record) => record.role === role)) {
    throw new Error("A ação desta função já foi registrada nesta noite.");
  }

  const groupHasLivingPlayers = hasLivingMember(match, role);
  if (!groupHasLivingPlayers && action) {
    throw new Error("Uma função sem participantes vivos não pode registrar uma ação.");
  }
  if (groupHasLivingPlayers && role !== "witch" && !action) {
    throw new Error("A função precisa registrar sua ação antes de avançar.");
  }
  if (action) {
    validateNightAction(match, role, action);
  }

  const actions = action
    ? [...match.night.actions, { role, action }]
    : match.night.actions;
  const nextCallIndex = match.night.nextCallIndex + 1;
  const night = { ...match.night, nextCallIndex, actions };
  const phase = action?.kind === "seer-investigate"
    ? "seer-result"
    : nextCallIndex < match.night.schedule.length ? "night" : "night-resolution";

  return {
    ...match,
    phase,
    night,
  };
}

export function continueAfterSeerResult(match: MatchState): MatchState {
  if (match.phase !== "seer-result" || !match.night ||
      match.night.nextCallIndex === 0 ||
      match.night.schedule[match.night.nextCallIndex - 1] !== "seer" ||
      !match.night.actions.some(
        (record) => record.role === "seer" && record.action.kind === "seer-investigate",
      )) {
    throw new Error("Não há resultado da Vidente aguardando confirmação.");
  }

  return {
    ...match,
    phase: match.night.nextCallIndex < match.night.schedule.length
      ? "night"
      : "night-resolution",
  };
}

export function reviseNightAction(
  match: MatchState,
  role: NightRole,
  action?: NightAction,
): MatchState {
  if (role === "seer") {
    throw new Error("A investigação da Vidente não pode ser revisada.");
  }
  if (match.phase !== "night-resolution" || !match.night) {
    throw new Error("As ações só podem ser revisadas antes de confirmar a noite.");
  }
  if (!match.night.schedule.includes(role)) {
    throw new Error("A função não faz parte da sequência desta partida.");
  }
  const existingIndex = match.night.actions.findIndex((record) => record.role === role);
  if (existingIndex < 0 && !action) {
    throw new Error("Não há ação registrada para remover.");
  }
  if (role !== "witch" && !action) {
    throw new Error("A ação desta função é obrigatória.");
  }
  if (!hasLivingMember(match, role) && action) {
    throw new Error("Uma função sem participantes vivos não pode registrar uma ação.");
  }
  if (action) {
    validateNightAction(match, role, action);
  }

  const actions = [...match.night.actions];
  if (existingIndex >= 0) {
    if (action) {
      actions[existingIndex] = { role, action };
    } else {
      actions.splice(existingIndex, 1);
    }
  } else if (action) {
    actions.push({ role, action });
  }

  return { ...match, night: { ...match.night, actions } };
}

export function resolveNight(match: MatchState): NightResolution {
  if (match.phase !== "night-resolution" || !match.night) {
    throw new Error("Todas as chamadas noturnas devem terminar antes da resolução.");
  }
  if (match.night.nextCallIndex !== match.night.schedule.length) {
    throw new Error("A sequência de chamadas noturnas ainda não foi concluída.");
  }
  const scheduledRoles = new Set(match.night.schedule);
  const recordedRoles = match.night.actions.map((record) => record.role);
  if (
    recordedRoles.some((role) => !scheduledRoles.has(role)) ||
    new Set(recordedRoles).size !== recordedRoles.length
  ) {
    throw new Error("As ações registradas não correspondem à sequência noturna.");
  }
  for (const role of match.night.schedule) {
    const record = match.night.actions.find((action) => action.role === role);
    if (!hasLivingMember(match, role) && record) {
      throw new Error("Uma função sem participantes vivos não pode ter ação registrada.");
    }
    if (hasLivingMember(match, role) && role !== "witch" && !record) {
      throw new Error("Uma ação noturna obrigatória não foi registrada.");
    }
    if (record) {
      validateNightAction(match, role, record.action);
    }
  }

  const protectionTargetIds = new Set<string>();
  const attacks: Array<{ role: "werewolf" | "witch"; targetId: string }> = [];
  const investigations = match.night.actions.flatMap((record) => {
    if (record.action.kind === "seer-investigate") {
      const target = getPlayer(match, record.action.targetId);
      return [{ targetId: target.id, isWerewolf: appearsAsWerewolfToSeer(target.role) }];
    }
    return [];
  });
  let witchProtectionUsed = false;
  let witchEliminationUsed = false;
  let lastBodyguardTargetId = match.lastBodyguardTargetId;
  let lastSpellcasterTargetId = match.lastSpellcasterTargetId;

  for (const { action } of match.night.actions) {
    switch (action.kind) {
      case "werewolf-attack":
        attacks.push({ role: "werewolf", targetId: action.targetId });
        break;
      case "bodyguard-protect":
        protectionTargetIds.add(action.targetId);
        lastBodyguardTargetId = action.targetId;
        break;
      case "witch":
        if (action.protectTargetId !== undefined) {
          protectionTargetIds.add(action.protectTargetId);
          witchProtectionUsed = true;
        }
        if (action.eliminateTargetId !== undefined) {
          attacks.push({ role: "witch", targetId: action.eliminateTargetId });
          witchEliminationUsed = true;
        }
        break;
      case "seer-investigate":
        break;
      case "spellcaster-silence":
        lastSpellcasterTargetId = action.targetId;
        break;
    }
  }

  const blockedAttackTargetIds = [
    ...new Set(
      attacks
        .filter((attack) => protectionTargetIds.has(attack.targetId))
        .map((attack) => attack.targetId),
    ),
  ];
  const wolfAttackTargetIds = new Set(
    attacks.filter((attack) => attack.role === "werewolf").map((attack) => attack.targetId),
  );
  const witchAttackTargetIds = new Set(
    attacks.filter((attack) => attack.role === "witch").map((attack) => attack.targetId),
  );
  const convertedPlayerIds = [...wolfAttackTargetIds].filter((targetId) => {
    const target = getPlayer(match, targetId);
    return target.role === "cursed" &&
      !protectionTargetIds.has(targetId) &&
      !witchAttackTargetIds.has(targetId);
  });
  const pendingCursedConversionPlayerIds = convertedPlayerIds;
  const pendingConversion = new Set(pendingCursedConversionPlayerIds);
  const eliminatedPlayerIds = [
    ...new Set(
      attacks
        .filter((attack) => !protectionTargetIds.has(attack.targetId))
        .map((attack) => attack.targetId)
        .filter((targetId) => !pendingConversion.has(targetId)),
    ),
  ];
  const eliminated = new Set(eliminatedPlayerIds);
  const players = match.players.map((player) =>
    pendingConversion.has(player.id)
      ? { ...player, pendingCursedConversion: true as const }
      : eliminated.has(player.id)
        ? {
          ...player,
          status: "dead" as const,
          eliminatedAtRound: match.round,
          eliminationCause: "night" as const,
        }
        : player,
  );
  const winner = determineWinner(players);
  const historyEntry = {
    type: "night-resolved" as const,
    round: match.round,
    actions: match.night.actions,
    eliminatedPlayerIds,
    ...(match.night.awakenedCursedPlayerIds?.length
      ? { convertedPlayerIds: match.night.awakenedCursedPlayerIds }
      : {}),
    ...(pendingCursedConversionPlayerIds.length
      ? { pendingCursedConversionPlayerIds }
      : {}),
    protectedPlayerIds: [...protectionTargetIds],
    blockedAttackTargetIds,
    investigations,
  };
  const nextMatch: MatchState = {
    ...match,
    players,
    phase: winner ? "finished" : "dawn",
    witchResources: {
      protectionUsed: match.witchResources.protectionUsed || witchProtectionUsed,
      eliminationUsed: match.witchResources.eliminationUsed || witchEliminationUsed,
    },
    lastBodyguardTargetId,
    lastSpellcasterTargetId,
    history: appendHistory(match.history, historyEntry),
    ...(winner ? { winner } : {}),
  };

  return {
    match: nextMatch,
    eliminatedPlayerIds,
    convertedPlayerIds: match.night.awakenedCursedPlayerIds ?? [],
    pendingCursedConversionPlayerIds,
    protectedPlayerIds: [...protectionTargetIds],
    blockedAttackTargetIds,
    investigations,
    publicAnnouncement: eliminatedPlayerIds.length
      ? { kind: "deaths", eliminatedPlayerIds }
      : { kind: "no-deaths" },
    ...(winner ? { winner } : {}),
  };
}

export function startDiscussion(match: MatchState, nowMs: number): MatchState {
  assertTimestamp(nowMs);
  if (match.phase !== "dawn") {
    throw new Error("A discussão só pode começar depois do amanhecer.");
  }

  return {
    ...match,
    phase: "discussion",
    discussion: {
      status: "running",
      remainingMs: match.dayDurationMinutes * DAY_MS,
      startedAtMs: nowMs,
    },
  };
}

function advanceTimer(match: MatchState, nowMs: number): MatchState {
  assertTimestamp(nowMs);
  if (match.phase !== "discussion" || !match.discussion) {
    throw new Error("A partida não está na discussão.");
  }
  if (match.discussion.status !== "running" || match.discussion.startedAtMs === null) {
    return match;
  }
  if (nowMs < match.discussion.startedAtMs) {
    throw new Error("O relógio não pode retroceder durante a discussão.");
  }

  const elapsedMs = nowMs - match.discussion.startedAtMs;
  const remainingMs = Math.max(0, match.discussion.remainingMs - elapsedMs);
  const expired = remainingMs === 0;

  return {
    ...match,
    discussion: {
      status: expired ? "expired" : "running",
      remainingMs,
      startedAtMs: expired ? null : nowMs,
    },
  };
}

export function updateDiscussionClock(match: MatchState, nowMs: number): MatchState {
  return advanceTimer(match, nowMs);
}

export function pauseDiscussion(match: MatchState, nowMs: number): MatchState {
  if (match.phase !== "discussion" || match.discussion?.status !== "running") {
    throw new Error("O temporizador só pode ser pausado enquanto está em execução.");
  }
  const updated = advanceTimer(match, nowMs);
  if (updated.discussion?.status !== "running" || !updated.discussion) {
    return updated;
  }
  return {
    ...updated,
    discussion: { ...updated.discussion, status: "paused", startedAtMs: null },
  };
}

export function resumeDiscussion(match: MatchState, nowMs: number): MatchState {
  assertTimestamp(nowMs);
  if (match.phase !== "discussion" || match.discussion?.status !== "paused") {
    throw new Error("O temporizador não está pausado.");
  }
  if (match.discussion.remainingMs === 0) {
    return { ...match, discussion: { ...match.discussion, status: "expired" } };
  }
  return {
    ...match,
    discussion: { ...match.discussion, status: "running", startedAtMs: nowMs },
  };
}

export function endDiscussion(match: MatchState, nowMs: number): MatchState {
  const updated = advanceTimer(match, nowMs);
  if (!updated.discussion || updated.discussion.status === "ended") {
    throw new Error("A discussão já foi encerrada.");
  }
  return {
    ...updated,
    discussion: {
      ...updated.discussion,
      status: "ended",
      startedAtMs: null,
    },
  };
}

export function startVoting(
  match: MatchState,
  random?: RandomSource,
): MatchState {
  if (
    match.phase !== "discussion" ||
    !match.discussion ||
    !["ended", "expired"].includes(match.discussion.status)
  ) {
    throw new Error("Encerre a discussão antes de iniciar a votação.");
  }

  const order = shuffleOrder(
    getLivingPlayers(match).map((player) => player.id),
    random,
  );
  return {
    ...match,
    phase: "voting",
    voting: { order, nextVoterIndex: 0, votes: [] },
  };
}

export function skipVoting(match: MatchState): MatchState {
  if (
    match.phase !== "discussion" ||
    !match.discussion ||
    !["ended", "expired"].includes(match.discussion.status)
  ) {
    throw new Error("Encerre a discussão antes de pular a votação.");
  }

  return startNextNight({ ...match, phase: "ready-for-night" });
}

export function recordVote(match: MatchState, voterId: string, choice: VoteChoice): MatchState {
  if (match.phase !== "voting" || !match.voting) {
    throw new Error("A partida não está aguardando votos.");
  }

  const expectedVoterId = match.voting.order[match.voting.nextVoterIndex];
  if (voterId !== expectedVoterId) {
    throw new Error("Os votos devem ser registrados na ordem sorteada.");
  }
  if (getPlayer(match, voterId).status !== "alive") {
    throw new Error("Somente jogadores vivos e não exilados podem votar.");
  }
  if (choice.kind === "player") {
    const target = validateLivingTarget(match, choice.playerId);
    if (target.id === voterId) {
      throw new Error("O jogador não pode votar em si mesmo.");
    }
  }

  const votes = [...match.voting.votes, { voterId, choice }];
  return {
    ...match,
    voting: {
      ...match.voting,
      nextVoterIndex: match.voting.nextVoterIndex + 1,
      votes,
    },
  };
}

export function isVotingDecided(match: MatchState): boolean {
  if (match.phase !== "voting" || !match.voting) return false;

  const { order, votes } = match.voting;
  const remainingVotes = order.length - votes.length;
  if (remainingVotes <= 0) return votes.length === order.length;

  const counts: Record<string, number> = {};
  let annulVotes = 0;
  for (const vote of votes) {
    if (vote.choice.kind === "annul") {
      annulVotes += 1;
    } else {
      counts[vote.choice.playerId] = (counts[vote.choice.playerId] ?? 0) + 1;
    }
  }

  if (annulVotes > order.length / 2) return true;

  const annulMajorityStillPossible = annulVotes + remainingVotes > order.length / 2;
  if (annulMajorityStillPossible) return false;

  const choices = Object.entries(counts);
  const maxPlayerVotes = Math.max(0, ...choices.map(([, count]) => count));
  if (annulVotes > maxPlayerVotes + remainingVotes) return true;

  return choices.some(([playerId, count]) => {
    const maxOtherVotes = Math.max(
      annulVotes,
      0,
      ...choices
        .filter(([otherPlayerId]) => otherPlayerId !== playerId)
        .map(([, otherCount]) => otherCount),
    );
    return count > maxOtherVotes + remainingVotes;
  });
}

export function resolveVoting(match: MatchState): VoteResolution {
  if (match.phase !== "voting" || !match.voting) {
    throw new Error("A votação não está em andamento.");
  }
  if (!isVotingDecided(match)) {
    throw new Error("A votação ainda não tem resultado definido.");
  }

  const counts: Record<string, number> = {};
  let annulVotes = 0;
  for (const vote of match.voting.votes) {
    if (vote.choice.kind === "annul") {
      annulVotes += 1;
    } else {
      counts[vote.choice.playerId] = (counts[vote.choice.playerId] ?? 0) + 1;
    }
  }

  const tally = [
    ...Object.entries(counts).map(([key, count]) => ({ key, count })),
    { key: "annul", count: annulVotes },
  ];
  const highestCount = Math.max(...tally.map((entry) => entry.count));
  const topChoices = tally.filter((entry) => entry.count === highestCount);

  let outcome: VoteResolution["outcome"];
  let exiledPlayerId: string | undefined;
  if (annulVotes > match.voting.order.length / 2) {
    outcome = "annulled-majority";
  } else if (topChoices.length > 1) {
    outcome = "annulled-tie";
  } else if (topChoices[0].key === "annul") {
    outcome = "annulled-plurality";
  } else {
    outcome = "exiled";
    exiledPlayerId = topChoices[0].key;
  }

  const players = exiledPlayerId
    ? match.players.map((player) =>
        player.id === exiledPlayerId
          ? {
              ...player,
              status: "exiled" as const,
              eliminatedAtRound: match.round,
              eliminationCause: "vote" as const,
            }
          : player,
      )
    : match.players;
  const winner = exiledPlayerId ? determineWinner(players) : undefined;
  const historyEntry: VoteHistoryEntry = {
    type: "vote-resolved",
    round: match.round,
    outcome,
    annulVotes,
    counts,
    ...(exiledPlayerId ? { exiledPlayerId } : {}),
  };
  const nextMatch: MatchState = {
    ...match,
    players,
    phase: winner ? "finished" : "ready-for-night",
    history: appendHistory(match.history, historyEntry),
    ...(winner ? { winner } : {}),
  };

  return {
    match: nextMatch,
    outcome,
    counts,
    annulVotes,
    ...(exiledPlayerId ? { exiledPlayerId } : {}),
    ...(winner ? { winner } : {}),
  };
}

export function startNextNight(match: MatchState): MatchState {
  if (match.phase !== "ready-for-night") {
    throw new Error("A partida ainda não está pronta para iniciar outra noite.");
  }
  const round = match.round + 1;
  const awakeningRequired = match.players.some(
    (player) => player.status === "alive" && player.pendingCursedConversion,
  );
  return {
    ...match,
    phase: "night",
    round,
    night: {
      schedule: getNightSchedule(match),
      nextCallIndex: 0,
      actions: [],
      ...(awakeningRequired ? { awakeningRequired: true } : {}),
    },
    discussion: undefined,
    voting: undefined,
  };
}

export function awakenCursed(match: MatchState): MatchState {
  if (
    match.phase !== "night" ||
    !match.night ||
    match.night.nextCallIndex !== 0 ||
    match.night.schedule[0] !== "werewolf" ||
    match.night.awakeningRequired !== true
  ) {
    throw new Error("Não há Amaldiçoado aguardando para despertar com os Lobisomens.");
  }

  const awakenedCursedPlayerIds = match.players
    .filter((player) => player.status === "alive" && player.pendingCursedConversion)
    .map((player) => player.id);
  if (awakenedCursedPlayerIds.length !== 1) {
    throw new Error("A partida deve ter exatamente um Amaldiçoado vivo aguardando conversão.");
  }
  const awakened = new Set(awakenedCursedPlayerIds);
  const players = match.players.map((player) => {
    if (!awakened.has(player.id)) return player;
    const { pendingCursedConversion: _pending, ...rest } = player;
    return { ...rest, role: "werewolf" as const, convertedFromCursed: true as const };
  });

  return {
    ...match,
    players,
    night: {
      ...match.night,
      awakeningRequired: false,
      awakenedCursedPlayerIds,
    },
  };
}
