import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createGame } from "../domain/game";
import { deleteGame, getMatch, listGames, saveGame } from "../infrastructure/game-repository";

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
  await screen.findByRole("heading", { name: "Preparada" });
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
  clickButton("Registrar chamada e avançar");
  await waitForSavedProgress();

  await screen.findByRole("heading", { name: /Chamar: Vidente/ });
  const firstInvestigation = chooseRadio("night-target", (input) => !input.disabled);
  clickButton("Registrar chamada e avançar");
  await screen.findByRole("heading", { name: "Revisar ações antes de confirmar" });
  await waitForSavedProgress();

  const seerAction = Array.from(document.querySelectorAll(".private-list li")).find((row) =>
    row.textContent?.includes(`VidenteInvestigação: ${firstInvestigation}`),
  );
  assert.ok(seerAction);
  fireEvent.click(seerAction.querySelector("button")!);
  const revisedInvestigation = chooseRadio(
    "night-target",
    (input) => !input.disabled && selectedPlayerName(input) !== firstInvestigation,
  );
  clickButton("Salvar correção");
  await waitForSavedProgress();
  assert.notEqual(revisedInvestigation, firstInvestigation);

  clickButton("Voltar às partidas");
  await screen.findByRole("heading", { name: "Suas partidas" });
  await screen.findByRole("button", { name: /Noite integrada/ });
  await clickGameAndWaitForDetails(/Noite integrada/, "Retomar partida");
  clickButton("Retomar partida");
  await screen.findByRole("heading", { name: "Confirmação da noite" });
  assert.ok(screen.getByText(`Investigação: ${revisedInvestigation}`));

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

  for (let index = 0; index < 5; index += 1) {
    const voter = screen.getByText(/Registre em privado o voto aberto de/).textContent ?? "";
    const targetName = voter.includes(werewolf)
      ? game.players.find((player) => player.name !== werewolf)?.name
      : werewolf;
    assert.ok(targetName);
    chooseRadio("vote-choice", (input) => selectedPlayerName(input) === targetName);
    clickButton("Registrar voto");
    await waitForSavedProgress();
  }

  await screen.findByRole("heading", { name: "Todos os votos foram registrados" });
  clickButton("Apurar e confirmar votação");
  await waitFor(() => {
    assert.equal(document.querySelector("#console-title")?.textContent, "Partida encerrada");
  });
  assert.ok(screen.getByText("vitória dos Aldeões."));
  assert.ok(screen.getByRole("heading", { name: "Histórico privado" }));
  await waitForSavedProgress();
  const finishedMatch = await getMatch(game.id);
  assert.equal(finishedMatch?.phase, "finished");
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
