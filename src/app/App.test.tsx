import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import { JSDOM } from "jsdom";
import { version as packageVersion, codename as releaseCodename } from "../../package.json";
import { act } from "react";
import { createGame } from "../domain/game";
import {
  continueAfterSeerResult,
  endDiscussion,
  recordVote,
  resolveNight,
  resolveVoting,
  startDiscussion,
  startMatch,
  startNextNight,
  startVoting,
  submitNightCall,
} from "../domain/match-engine";
import type { MatchState } from "../domain/match";
import { createMatch } from "../domain/match-setup";
import {
  deleteGame,
  getMatch,
  listGames,
  saveGame,
  saveGameAndMatch,
} from "../infrastructure/game-repository";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
dom.window.confirm = () => true;
dom.window.setInterval = () => 1;
dom.window.clearInterval = () => undefined;
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
});
Object.assign(globalThis, {
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { cleanup, fireEvent, render, screen, waitFor } = await import("@testing-library/react");
const { default: App } = await import("./App");

afterEach(async () => {
  cleanup();
  for (const game of await listGames()) {
    await deleteGame(game.id);
  }
});

function clickButton(name: string | RegExp): HTMLButtonElement {
  const button = screen.getByRole("button", { name }) as HTMLButtonElement;
  assert.equal(button.disabled, false, `O botão "${String(name)}" deve estar habilitado.`);
  fireEvent.click(button);
  return button;
}

function clickLastButton(name: string | RegExp): HTMLButtonElement {
  const buttons = screen.getAllByRole("button", { name }) as HTMLButtonElement[];
  const button = buttons[buttons.length - 1];
  assert.equal(button.disabled, false, `O botão "${String(name)}" deve estar habilitado.`);
  fireEvent.click(button);
  return button;
}

async function clickGameAndWaitForDetails(name: RegExp, actionName: string): Promise<void> {
  const gameButton = screen.getByRole("button", { name });
  await act(async () => {
    fireEvent.click(gameButton);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  });
  await waitFor(() => {
    const action = screen.getByRole("button", { name: actionName }) as HTMLButtonElement;
    assert.equal(action.disabled, false);
  });
}

async function renderApp(): Promise<void> {
  await act(async () => {
    render(<App />);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  });
}

async function waitForSavedProgress(): Promise<void> {
  await waitFor(() => {
    assert.equal(
      screen.getByRole("status").textContent,
      "Progresso salvo neste dispositivo.",
    );
  });
}

function fillInput(label: string, value: string): void {
  const inputs = screen.getAllByRole("textbox", { name: label });
  fireEvent.change(inputs[inputs.length - 1], { target: { value } });
}

function selectedPlayerName(input: HTMLInputElement): string {
  const name = input.closest("label")?.querySelector(".player-choice-name")?.textContent;
  assert.ok(name);
  return name.trim();
}

function radioInputs(name: string): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`));
}

function chooseRadio(name: string, predicate: (input: HTMLInputElement) => boolean): string {
  const input = radioInputs(name).find((candidate) => !candidate.disabled && predicate(candidate));
  assert.ok(input, `Não foi encontrada uma opção habilitada em "${name}".`);
  fireEvent.click(input);
  return selectedPlayerName(input);
}

async function createMatchThroughForm(gameName: string): Promise<void> {
  await waitFor(() => {
    const button = screen.getByRole("button", { name: /Sortear papéis e preparar/ }) as HTMLButtonElement;
    assert.equal(button.disabled, false);
  });
  fillInput("Nome da partida", gameName);
  for (let index = 1; index <= 5; index += 1) {
    fillInput(`Nome do participante ${index}`, `Jogador ${index}`);
  }
  clickButton(/Sortear papéis e preparar/);
  await screen.findByRole("heading", { name: "Preparação" });
  await waitForSavedProgress();
}

function getRoleHolder(roleLabel: string): string {
  const roster = document.querySelector(".roster-list");
  assert.ok(roster);
  const row = Array.from(roster.querySelectorAll("li")).find((item) =>
    item.textContent?.includes(roleLabel),
  );
  assert.ok(row, `A função "${roleLabel}" deve estar no cadastro da partida.`);
  const name = row.querySelector("span")?.textContent;
  assert.ok(name);
  return name;
}

it("allows editing and deleting a game record without match progress", async () => {
  const game = createGame({
    id: "cadastro-editavel",
    name: "Cadastro antigo",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `participante-${index + 1}`,
      name: `Participante ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  await saveGame(game);
  await renderApp();

  await screen.findByRole("button", { name: /Cadastro antigo/ });
  await clickGameAndWaitForDetails(/Cadastro antigo/, "Editar cadastro");
  clickButton("Editar cadastro");

  fillInput("Nome da partida", "Cadastro atualizado");
  fillInput("Nome do participante editado 1", "Ana");
  clickLastButton("Adicionar participante");
  fillInput("Nome do participante editado 6", "Eva");
  clickButton("Remover participante editado 5");
  clickButton("Salvar alterações");

  await screen.findByRole("button", { name: /Cadastro atualizado/ });
  const savedGames = await listGames();
  assert.equal(savedGames.length, 1);
  assert.equal(savedGames[0].name, "Cadastro atualizado");
  assert.deepEqual(savedGames[0].players.map((player) => player.name), [
    "Ana",
    "Participante 2",
    "Participante 3",
    "Participante 4",
    "Eva",
  ]);
  assert.equal(await getMatch(game.id), undefined);

  clickButton("Excluir partida");
  await screen.findByText("Nenhuma partida por aqui.");
  assert.deepEqual(await listGames(), []);
});

it("shows the release label and can redraw roles before the match starts", async () => {
  await renderApp();
  assert.ok(screen.getByRole("link", { name: /Werewolf Moderator, início/ }));
  assert.ok(screen.getByText(`v${packageVersion} · ${releaseCodename}`));
  assert.equal(
    screen.getByRole("group", { name: "Time dos lobisomens" }).querySelectorAll(".role-count").length,
    1,
  );
  assert.equal(
    screen.getByRole("group", { name: "Time dos aldeões" }).querySelectorAll(".role-count").length,
    8,
  );
  await createMatchThroughForm("Novo sorteio");

  const game = (await listGames())[0];
  assert.ok(game);
  const before = await getMatch(game.id);
  assert.equal(before?.phase, "prepared");
  clickButton("Sortear funções novamente");
  await waitForSavedProgress();

  const redrawn = await getMatch(game.id);
  assert.equal(redrawn?.phase, "prepared");
  assert.equal(redrawn?.round, 0);
  assert.equal(redrawn?.history.length, 0);
  assert.deepEqual(
    redrawn?.players.map(({ id, name }) => ({ id, name })),
    game.players,
  );
  assert.deepEqual(
    redrawn?.players.reduce<Record<string, number>>((counts, player) => {
      counts[player.role] = (counts[player.role] ?? 0) + 1;
      return counts;
    }, {}),
    { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
  );

  await act(async () => {
    fireEvent.click(screen.getByRole("link", { name: "Werewolf Moderator, início" }));
  });
  await screen.findByRole("heading", { name: "Nova partida" });
});

it("shows role help and the illustrated character catalog", async () => {
  await renderApp();

  const werewolfHelp = document.querySelector(
    '.role-info summary[aria-label="Informações sobre Lobisomem"]',
  );
  assert.ok(werewolfHelp);
  const helpDetails = werewolfHelp.closest("details");
  assert.ok(helpDetails);
  fireEvent.click(werewolfHelp);
  assert.equal(helpDetails.open, true);
  assert.match(helpDetails.textContent ?? "", /À noite, os Lobisomens vivos/);

  const catalogLink = screen.getByRole("link", { name: "Personagens" });
  assert.equal(catalogLink.getAttribute("href"), "#personagens");
  assert.ok(screen.getByRole("heading", { name: "Personagens da vila" }));
  for (const role of ["Lobisomem", "Guarda-costas", "Bruxa", "Vidente", "Denunciador", "Lycan", "Amaldiçoado", "Conjurador", "Aldeão"]) {
    assert.ok(screen.getByRole("heading", { level: 3, name: role }));
  }
  assert.equal(document.querySelectorAll(".role-illustration").length, 9);
});

it("keeps a Cursed conversion secret until the moderator wakes them with the Wolves", async () => {
  const game = createGame({
    id: "amaldiçoado-ui",
    name: "Amaldiçoado",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `cursed-ui-${index + 1}`,
      name: ["Lobo", "Amaldiçoado", "Guarda", "Bruxa", "Vidente"][index],
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
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
    targetId: "cursed-ui-2",
  });
  match = submitNightCall(match, "bodyguard", {
    kind: "bodyguard-protect",
    targetId: "cursed-ui-3",
  });
  match = submitNightCall(match, "witch");
  match = submitNightCall(match, "seer", {
    kind: "seer-investigate",
    targetId: "cursed-ui-2",
  });
  match = continueAfterSeerResult(match);
  match = resolveNight(match).match;
  match = startDiscussion(match, 0);
  match = endDiscussion(match, 0);
  match = startVoting(match, () => 0.5);
  for (const voterId of match.voting!.order) {
    match = recordVote(match, voterId, { kind: "annul" });
  }
  match = startNextNight(resolveVoting(match).match);
  await saveGameAndMatch(game, match);
  await renderApp();

  await screen.findByRole("button", { name: /Amaldiçoado/ });
  await clickGameAndWaitForDetails(/Amaldiçoado/, "Retomar partida");
  clickButton("Retomar partida");

  await screen.findByRole("heading", { name: "Despertar discreto" });
  assert.ok(screen.getByText(/só passa a ser Lobisomem e saberá da conversão a partir deste momento/));
  assert.equal((await getMatch(game.id))?.players.find((player) => player.id === "cursed-ui-2")?.role, "cursed");
  clickButton("Acordei discretamente o Amaldiçoado");
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  await waitForSavedProgress();
  assert.equal((await getMatch(game.id))?.players.find((player) => player.id === "cursed-ui-2")?.role, "werewolf");
});

it("records the Denunciador action privately and resolves an unprotected Werewolf", async () => {
  const players = Array.from({ length: 5 }, (_, index) => ({
    id: `revealer-ui-${index + 1}`,
    name: `Participante ${index + 1}`,
  }));
  const game = createGame({
    id: "revealer-ui",
    name: "Denunciador",
    players,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const roles = ["werewolf", "bodyguard", "witch", "seer", "revealer"] as const;
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, revealer: 1 },
    dayDurationMinutes: 5,
  });
  let match: MatchState = {
    ...prepared,
    players: prepared.players.map((player, index) => ({
      ...player,
      role: roles[index],
    })),
  };
  const werewolf = match.players.find((player) => player.role === "werewolf")!;
  const revealer = match.players.find((player) => player.role === "revealer")!;
  match = startMatch(match);
  match = submitNightCall(match, "werewolf", {
    kind: "werewolf-attack",
    targetId: "revealer-ui-3",
  });
  match = submitNightCall(match, "bodyguard", {
    kind: "bodyguard-protect",
    targetId: "revealer-ui-3",
  });
  match = submitNightCall(match, "witch");
  match = submitNightCall(match, "seer", {
    kind: "seer-investigate",
    targetId: revealer.id,
  });
  match = continueAfterSeerResult(match);
  await saveGameAndMatch(game, match);
  await renderApp();

  await screen.findByRole("button", { name: /Denunciador/ });
  await clickGameAndWaitForDetails(/Denunciador/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { name: /Chamar: Denunciador/ });

  const targetInputs = radioInputs("night-target");
  const selfInput = targetInputs.find((input) => selectedPlayerName(input) === revealer.name);
  const werewolfInput = targetInputs.find((input) => selectedPlayerName(input) === werewolf.name);
  assert.ok(selfInput?.disabled);
  assert.ok(werewolfInput && !werewolfInput.disabled);
  fireEvent.click(werewolfInput);
  clickButton("Registrar chamada e avançar");

  await screen.findByRole("heading", { name: "Revisar ações antes de confirmar" });
  assert.ok(screen.getByText(`Denúncia: ${werewolf.name}`));
  await waitForSavedProgress();
  clickButton("Confirmar resolução da noite");
  await screen.findByRole("heading", { level: 2, name: "Partida encerrada" });
  const resolved = await getMatch(game.id);
  assert.equal(resolved?.winner, "villagers");
  assert.deepEqual(resolved?.history[0]?.type === "night-resolved"
    ? resolved.history[0].eliminatedPlayerIds
    : [], [werewolf.id]);
  assert.ok(resolved?.history[0]?.type === "night-resolved" &&
    resolved.history[0].actions.some((record) => record.role === "revealer"));
});

it("lets the Denunciador skip a night action in the moderator interface", async () => {
  const players = Array.from({ length: 5 }, (_, index) => ({
    id: `revealer-skip-${index + 1}`,
    name: `Participante ${index + 1}`,
  }));
  const game = createGame({
    id: "revealer-skip-ui",
    name: "Denunciador opcional",
    players,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const roles = ["werewolf", "bodyguard", "witch", "seer", "revealer"] as const;
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, revealer: 1 },
    dayDurationMinutes: 5,
  });
  let match: MatchState = {
    ...prepared,
    players: prepared.players.map((player, index) => ({
      ...player,
      role: roles[index],
    })),
  };
  match = startMatch(match);
  match = submitNightCall(match, "werewolf", {
    kind: "werewolf-attack",
    targetId: players[4].id,
  });
  match = submitNightCall(match, "bodyguard", {
    kind: "bodyguard-protect",
    targetId: players[4].id,
  });
  match = submitNightCall(match, "witch");
  match = submitNightCall(match, "seer", {
    kind: "seer-investigate",
    targetId: players[4].id,
  });
  match = continueAfterSeerResult(match);
  await saveGameAndMatch(game, match);
  await renderApp();

  await screen.findByRole("button", { name: /Denunciador opcional/ });
  await clickGameAndWaitForDetails(/Denunciador opcional/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { name: /Chamar: Denunciador/ });
  clickButton("Não denunciar esta noite");

  await screen.findByRole("heading", { name: "Revisar ações antes de confirmar" });
  const saved = await getMatch(game.id);
  assert.equal(saved?.night?.actions.some((record) => record.role === "revealer"), false);
  clickButton("Confirmar resolução da noite");
  await screen.findByRole("heading", { name: "Resultado privado da noite" });
});

it("confirms restarting from an active phase and returns to role distribution", async () => {
  await renderApp();
  await createMatchThroughForm("Reinício");
  const game = (await listGames())[0];
  assert.ok(game);
  const rolesBefore = (await getMatch(game.id))?.players.map((player) => player.role).sort();

  clickButton("Iniciar a partida");
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  await waitForSavedProgress();

  const originalConfirm = window.confirm;
  const confirmations: string[] = [];
  window.confirm = (message?: string) => {
    confirmations.push(message ?? "");
    return false;
  };
  try {
    clickButton("Reiniciar partida");
    assert.match(confirmations[0], /Reiniciar a partida/);
    assert.equal((await getMatch(game.id))?.phase, "night");

    window.confirm = () => true;
    clickButton("Reiniciar partida");
    await screen.findByRole("heading", { name: "Preparação" });
    await waitForSavedProgress();
  } finally {
    window.confirm = originalConfirm;
  }

  const restarted = await getMatch(game.id);
  assert.equal(restarted?.phase, "prepared");
  assert.equal(restarted?.round, 0);
  assert.deepEqual(restarted?.history, []);
  assert.ok(restarted?.players.every((player) => player.status === "alive"));
  assert.deepEqual(
    restarted?.players.map((player) => player.role).sort(),
    rolesBefore,
  );
  assert.deepEqual(
    restarted?.players.map(({ id, name }) => ({ id, name })),
    game.players,
  );
});

it("edits a saved game roster by replacing its prepared match and role draw", async () => {
  const game = createGame({
    id: "cadastro-com-progresso",
    name: "Partida editável",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `edit-player-${index + 1}`,
      name: `Jogador ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const match = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
    dayDurationMinutes: 5,
  });
  await saveGameAndMatch(game, match);
  await renderApp();

  await screen.findByRole("button", { name: /Partida editável/ });
  await clickGameAndWaitForDetails(/Partida editável/, "Editar cadastro");
  clickButton("Editar cadastro");
  const editorWerewolfTeam = screen.getAllByRole("group", { name: "Time dos lobisomens" }).at(-1);
  const editorVillagerTeam = screen.getAllByRole("group", { name: "Time dos aldeões" }).at(-1);
  assert.ok(editorWerewolfTeam);
  assert.ok(editorVillagerTeam);
  assert.equal(
    editorWerewolfTeam.querySelectorAll(".role-count").length,
    1,
  );
  assert.equal(
    editorVillagerTeam.querySelectorAll(".role-count").length,
    8,
  );
  fillInput("Nome do participante editado 1", "Ana");
  clickButton("Remover participante editado 5");
  clickLastButton("Adicionar participante");
  fillInput("Nome do participante editado 5", "Eva");
  clickButton("Salvar alterações");

  await screen.findByRole("button", { name: /Retomar partida/ });
  const editedGame = (await listGames())[0];
  const editedMatch = await getMatch(game.id);
  assert.deepEqual(editedGame.players.map((player) => player.name), [
    "Ana",
    "Jogador 2",
    "Jogador 3",
    "Jogador 4",
    "Eva",
  ]);
  assert.equal(editedMatch?.phase, "prepared");
  assert.deepEqual(editedMatch?.history, []);
  assert.equal(editedMatch?.players.length, 5);
  assert.equal(editedMatch?.players.some((player) => player.id === "edit-player-5"), false);
  assert.deepEqual(
    editedMatch?.players.map(({ id, name }) => ({ id, name })),
    editedGame.players,
  );
});

it("restarts a finished match with the same players", async () => {
  const game = createGame({
    id: "replay-same-roster",
    name: "Revanche",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `replay-player-${index + 1}`,
      name: `Jogador ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
    dayDurationMinutes: 5,
  });
  await saveGameAndMatch(game, {
    ...prepared,
    phase: "finished",
    winner: "villagers",
  });
  await renderApp();

  await screen.findByRole("button", { name: /Revanche/ });
  await clickGameAndWaitForDetails(/Revanche/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { level: 3, name: "Partida encerrada" });
  clickButton("Jogar novamente");

  await screen.findByRole("heading", { name: "Preparação" });
  const replay = await getMatch(game.id);
  assert.equal(replay?.phase, "prepared");
  assert.deepEqual(replay?.history, []);
  assert.deepEqual(
    replay?.players.map(({ id }) => id).sort(),
    game.players.map(({ id }) => id).sort(),
  );
});

it("restarts a finished match after editing its participants", async () => {
  const game = createGame({
    id: "replay-edit-roster",
    name: "Nova mesa",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `replay-edit-player-${index + 1}`,
      name: `Jogador ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
    dayDurationMinutes: 5,
  });
  await saveGameAndMatch(game, {
    ...prepared,
    phase: "finished",
    winner: "villagers",
  });
  await renderApp();

  await screen.findByRole("button", { name: /Nova mesa/ });
  await clickGameAndWaitForDetails(/Nova mesa/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { level: 3, name: "Partida encerrada" });
  clickButton("Jogar novamente e editar participantes");
  fillInput("Nome do participante editado 1", "Ana");
  clickLastButton("Adicionar participante");
  fillInput("Nome do participante editado 6", "Eva");
  clickButton("Salvar e sortear novamente");

  await screen.findByRole("heading", { name: "Preparação" });
  const replay = await getMatch(game.id);
  assert.equal(replay?.phase, "prepared");
  assert.equal(replay?.players.length, 6);
  assert.equal(replay?.players.find((player) => player.name === "Ana")?.id, game.players[0].id);
  assert.equal(replay?.players.some((player) => player.id === "replay-edit-player-6"), false);
  assert.deepEqual(replay?.history, []);
});

it("imports a backup from the home screen and refreshes the saved games", async () => {
  const game = createGame({
    id: "backup-import-ui",
    name: "Partida restaurada",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `backup-import-player-${index + 1}`,
      name: `Participante ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const backup = {
    format: "werewolf-god-backup",
    version: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    games: [{ game }],
  };
  const file = new dom.window.File([JSON.stringify(backup)], "backup.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "text", { value: async () => JSON.stringify(backup)   });

  await renderApp();
  const importInput = document.querySelector<HTMLInputElement>('input[type="file"][aria-label="Importar backup"]');
  assert.ok(importInput);
  await act(async () => {
    fireEvent.change(importInput, { target: { files: [file] } });
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  });

  await screen.findByRole("button", { name: /Partida restaurada/ });
  await waitFor(() => {
    assert.match(screen.getByRole("status").textContent ?? "", /1 partida\(s\) importada\(s\)/);
  });
  assert.ok((await listGames()).some((savedGame) => savedGame.id === game.id));
});

it("can skip voting and start the next night from the discussion", async () => {
  const game = createGame({
    id: "pular-votacao-ui",
    name: "Sem votação",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `skip-vote-player-${index + 1}`,
      name: `Jogador ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
    dayDurationMinutes: 5,
  });
  await saveGameAndMatch(game, {
    ...prepared,
    phase: "discussion",
    round: 1,
    discussion: { status: "ended", remainingMs: 0, startedAtMs: null },
  });
  await renderApp();

  await screen.findByRole("button", { name: /Sem votação/ });
  await clickGameAndWaitForDetails(/Sem votação/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { level: 2, name: "Discussão" });
  clickButton("Pular votação e iniciar noite");
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  await waitForSavedProgress();

  const nextNight = await getMatch(game.id);
  assert.equal(nextNight?.phase, "night");
  assert.equal(nextNight?.round, 2);
  assert.equal(nextNight?.history.length, 0);
});

it("finishes a saved voting result when resuming an older match", async () => {
  const game = createGame({
    id: "votacao-salva-ui",
    name: "Votação salva",
    players: Array.from({ length: 5 }, (_, index) => ({
      id: `saved-vote-player-${index + 1}`,
      name: `Jogador ${index + 1}`,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  const prepared = createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts: { werewolf: 1, bodyguard: 1, witch: 1, seer: 1, villager: 1 },
    dayDurationMinutes: 5,
  });
  const werewolfId = prepared.players.find((player) => player.role === "werewolf")!.id;
  const otherPlayerId = prepared.players.find((player) => player.id !== werewolfId)!.id;
  const order = prepared.players.map((player) => player.id);
  const votes = order.map((voterId) => ({
    voterId,
    choice: {
      kind: "player" as const,
      playerId: voterId === werewolfId ? otherPlayerId : werewolfId,
    },
  }));
  await saveGameAndMatch(game, {
    ...prepared,
    phase: "voting",
    voting: { order, nextVoterIndex: order.length, votes },
  });
  await renderApp();

  await screen.findByRole("button", { name: /Votação salva/ });
  await clickGameAndWaitForDetails(/Votação salva/, "Retomar partida");
  clickButton("Retomar partida");
  await waitFor(() => {
    assert.equal(document.querySelector("#console-title")?.textContent, "Partida encerrada");
  });
  await waitForSavedProgress();

  const resolvedMatch = await getMatch(game.id);
  assert.equal(resolvedMatch?.phase, "finished");
  assert.equal(resolvedMatch?.history.at(-1)?.type, "vote-resolved");
});

it("covers setup, night calls and review, resume, voting, victory, and history", async () => {
  await renderApp();
  await createMatchThroughForm("Noite integrada");

  const game = (await listGames())[0];
  assert.ok(game);
  assert.equal(game.players.length, 5);
  assert.equal((await getMatch(game.id))?.phase, "prepared");

  const werewolf = getRoleHolder("Lobisomem");
  clickButton("Iniciar a partida");
  await waitForSavedProgress();
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  const victim = chooseRadio("night-target", (input) => !input.disabled);
  clickButton("Registrar chamada e avançar");
  await waitForSavedProgress();

  await screen.findByRole("heading", { name: /Chamar: Guarda-costas/ });
  chooseRadio("night-target", (input) => selectedPlayerName(input) === victim);
  clickButton("Registrar chamada e avançar");
  await waitForSavedProgress();

  await screen.findByRole("heading", { name: /Chamar: Bruxa/ });
  for (const pickerName of ["witch-protect-target", "witch-eliminate-target"]) {
    const target = document.querySelector<HTMLInputElement>(
      `input[type="checkbox"][name="${pickerName}"]:not(:disabled)`,
    );
    assert.ok(target);
    fireEvent.click(target);
    assert.equal(target.checked, true);
    fireEvent.click(target);
    assert.equal(target.checked, false);
  }
  clickButton("Registrar chamada e avançar");
  await waitForSavedProgress();

  await screen.findByRole("heading", { name: /Chamar: Vidente/ });
  const firstInvestigation = chooseRadio("night-target", (input) => !input.disabled);
  clickButton("Registrar chamada e avançar");
  await screen.findByRole("heading", { level: 3, name: "Resultado da investigação" });
  assert.ok(screen.getByText(
    firstInvestigation === werewolf ? "é Lobisomem." : "não é Lobisomem.",
  ));
  await waitForSavedProgress();
  clickButton("Vidente pode dormir novamente");
  await screen.findByRole("heading", { name: "Revisar ações antes de confirmar" });
  await waitForSavedProgress();

  const seerAction = Array.from(document.querySelectorAll(".private-list li")).find((row) =>
    row.textContent?.includes(`VidenteInvestigação: ${firstInvestigation}`),
  );
  assert.ok(seerAction);
  assert.equal(seerAction.querySelector("button"), null);

  clickButton("Voltar às partidas");
  await screen.findByRole("heading", { name: "Suas partidas" });
  await screen.findByRole("button", { name: /Noite integrada/ });
  await clickGameAndWaitForDetails(/Noite integrada/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { name: "Confirmação da noite" });
  assert.ok(screen.getByText(`Investigação: ${firstInvestigation}`));

  clickButton("Confirmar resolução da noite");
  await screen.findByRole("heading", { name: "Resultado privado da noite" });
  await waitForSavedProgress();
  assert.equal((await getMatch(game.id))?.phase, "dawn");
  assert.ok(screen.getByText("ninguém foi eliminado durante a noite."));

  clickButton("Abrir discussão e iniciar temporizador");
  await waitFor(() => {
    assert.equal(document.querySelector("#console-title")?.textContent, "Discussão");
  });
  const timer = screen.getByRole("timer");
  assert.equal(timer.getAttribute("aria-live"), "off");
  await waitForSavedProgress();
  clickButton("Pausar");
  await screen.findByText("Temporizador pausado.");
  await waitForSavedProgress();
  clickButton("Retomar");
  await waitForSavedProgress();
  clickButton("Encerrar discussão");
  await waitForSavedProgress();
  clickButton("Iniciar votação");
  await screen.findByRole("heading", { name: "Voto 1 de 5" });
  await waitForSavedProgress();

  for (let index = 0; index < 5 && !screen.queryByRole("heading", { level: 2, name: "Partida encerrada" }); index += 1) {
    const voter = screen.getByText(/Registre em privado o voto aberto de/).textContent ?? "";
    const targetName = voter.includes(werewolf)
      ? game.players.find((player) => player.name !== werewolf)?.name
      : werewolf;
    assert.ok(targetName);
    chooseRadio("vote-choice", (input) => selectedPlayerName(input) === targetName);
    clickButton("Registrar voto");
    await waitForSavedProgress();
  }

  await waitFor(() => {
    assert.equal(document.querySelector("#console-title")?.textContent, "Partida encerrada");
  });
  assert.ok(screen.getByText("vitória dos Aldeões."));
  assert.ok(screen.getByRole("heading", { name: "Histórico privado" }));
  await waitForSavedProgress();
  const finishedMatch = await getMatch(game.id);
  assert.equal(finishedMatch?.phase, "finished");
  assert.ok((finishedMatch?.voting?.votes.length ?? 0) < (finishedMatch?.voting?.order.length ?? 0));
  assert.equal(finishedMatch?.winner, "villagers");
  assert.equal(finishedMatch?.history.length, 2);

  cleanup();
  await renderApp();
  await screen.findByRole("button", { name: /Noite integrada/ });
  await clickGameAndWaitForDetails(/Noite integrada/, "Retomar partida");
  clickButton("Retomar partida");
  await waitFor(() => {
    assert.equal(document.querySelector("#console-title")?.textContent, "Partida encerrada");
  });
  assert.ok(screen.getByText("vitória dos Aldeões."));
});

it("allows including Lycan and shows it as a Werewolf to the Seer", async () => {
  await renderApp();
  await waitFor(() => {
    const button = screen.getByRole("button", { name: /Sortear papéis e preparar/ }) as HTMLButtonElement;
    assert.equal(button.disabled, false);
  });

  fillInput("Nome da partida", "Lycan");
  for (let index = 1; index <= 5; index += 1) {
    fillInput(`Nome do participante ${index}`, `Jogador ${index}`);
  }
  for (const [role, count] of [
    ["Guarda-costas", 0],
    ["Bruxa", 0],
    ["Lycan", 1],
    ["Aldeão", 2],
  ] as const) {
    fireEvent.change(screen.getByRole("spinbutton", { name: `Quantidade de ${role}` }), {
      target: { value: String(count) },
    });
  }
  clickButton(/Sortear papéis e preparar/);
  await screen.findByRole("heading", { name: "Preparação" });
  await waitForSavedProgress();

  const lycan = getRoleHolder("Lycan");
  const seer = getRoleHolder("Vidente");
  clickButton("Iniciar a partida");
  await waitForSavedProgress();
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  chooseRadio("night-target", (input) => selectedPlayerName(input) !== lycan && selectedPlayerName(input) !== seer);
  clickButton("Registrar chamada e avançar");
  await waitForSavedProgress();

  await screen.findByRole("heading", { name: /Chamar: Vidente/ });
  chooseRadio("night-target", (input) => selectedPlayerName(input) === lycan);
  clickButton("Registrar chamada e avançar");

  await screen.findByRole("heading", { level: 3, name: "Resultado da investigação" });
  assert.ok(screen.getByText("é Lobisomem."));
});

it("calls the Conjurador after the Seer and shows the private silence reminder through voting", async () => {
  await renderApp();
  await waitFor(() => {
    const button = screen.getByRole("button", { name: /Sortear papéis e preparar/ }) as HTMLButtonElement;
    assert.equal(button.disabled, false);
  });

  fillInput("Nome da partida", "Conjurador");
  for (let index = 1; index <= 5; index += 1) {
    fillInput(`Nome do participante ${index}`, `Jogador ${index}`);
  }
  for (const [role, count] of [
    ["Guarda-costas", 0],
    ["Bruxa", 0],
    ["Vidente", 1],
    ["Conjurador", 1],
    ["Aldeão", 2],
  ] as const) {
    fireEvent.change(screen.getByRole("spinbutton", { name: `Quantidade de ${role}` }), {
      target: { value: String(count) },
    });
  }
  clickButton(/Sortear papéis e preparar/);
  await screen.findByRole("heading", { name: "Preparação" });
  await waitForSavedProgress();

  const conjurer = getRoleHolder("Conjurador");
  clickButton("Iniciar a partida");
  await screen.findByRole("heading", { name: /Chamar: Lobisomem/ });
  await waitForSavedProgress();
  chooseRadio("night-target", (input) => selectedPlayerName(input) !== conjurer);
  clickButton("Registrar chamada e avançar");

  await screen.findByRole("heading", { name: /Chamar: Vidente/ });
  await waitForSavedProgress();
  chooseRadio("night-target", (input) => !input.disabled);
  clickButton("Registrar chamada e avançar");
  await screen.findByRole("heading", { level: 3, name: "Resultado da investigação" });
  await waitForSavedProgress();
  clickButton("Vidente pode dormir novamente");

  await screen.findByRole("heading", { name: /Chamar: Conjurador/ });
  await waitForSavedProgress();
  assert.ok(document.body.textContent?.includes("Depois de registrar a escolha, aproxime-se sem fazer barulho"));
  chooseRadio("night-target", (input) => selectedPlayerName(input) === conjurer);
  clickButton("Registrar chamada e avançar");

  await screen.findByRole("heading", { name: "Revisar ações antes de confirmar" });
  await waitForSavedProgress();
  assert.ok(document.body.textContent?.includes(`Silenciamento: ${conjurer}`));
  assert.ok(document.body.textContent?.includes(
    `Lembrete: aproxime-se sem fazer barulho e toque no ombro de ${conjurer}`,
  ));
  clickButton("Confirmar resolução da noite");
  await screen.findByRole("heading", { name: "Resultado privado da noite" });
  await waitForSavedProgress();
  assert.ok(document.body.textContent?.includes(`Silenciamento (privado): ${conjurer}`));
  clickButton("Abrir discussão e iniciar temporizador");
  await waitForSavedProgress();
  assert.ok(document.body.textContent?.includes(`Silenciado (privado): ${conjurer}`));
  clickButton("Encerrar discussão");
  await waitForSavedProgress();
  clickButton("Iniciar votação");
  await waitForSavedProgress();
  assert.ok(document.body.textContent?.includes("continua votando"));
});
