import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { version as packageVersion, codename as releaseCodename } from "../../package.json";
import {
  awakenCursed,
  continueAfterSeerResult,
  endDiscussion,
  isVotingDecided,
  pauseDiscussion,
  recordVote,
  resolveNight,
  resolveVoting,
  resumeDiscussion,
  reviseNightAction,
  startDiscussion,
  startMatch,
  startNextNight,
  startVoting,
  skipVoting,
  submitNightCall,
  updateDiscussionClock,
} from "../domain/match-engine";
import type {
  MatchPlayer,
  MatchState,
  NightAction,
  NightHistoryEntry,
  VoteChoice,
} from "../domain/match";
import { createMatch, type PlayerInput } from "../domain/match-setup";
import {
  appearsAsWerewolfToSeer,
  ROLE_IDS,
  ROLE_LABELS,
  type NightRole,
  type RoleId,
} from "../domain/ruleset-v1";
import { createGame, type Game } from "../domain/game";
import {
  createBackup,
  deleteGame,
  getMatch,
  importBackup,
  listGames,
  parseBackup,
  saveGame,
  saveGameAndMatch,
  saveMatch,
} from "../infrastructure/game-repository";

const INITIAL_ROLE_COUNTS: Record<RoleId, number> = {
  werewolf: 1,
  bodyguard: 1,
  witch: 1,
  seer: 1,
  revealer: 0,
  lycan: 0,
  cursed: 0,
  spellcaster: 0,
  villager: 1,
};
const RELEASE_LABEL = `v${packageVersion} · ${releaseCodename}`;
const ROLE_DESCRIPTIONS: Record<RoleId, string> = {
  werewolf: "À noite, os Lobisomens vivos escolhem em consenso um jogador que não seja Lobisomem para eliminar.",
  bodyguard: "Protege uma pessoa de ataques noturnos. Não pode proteger o mesmo alvo em noites consecutivas.",
  witch: "Compartilha um uso de proteção e um de eliminação durante toda a partida; ambos são opcionais.",
  seer: "Investiga uma pessoa por noite e descobre apenas se ela aparece como Lobisomem.",
  revealer: "Toda noite pode denunciar uma pessoa viva. Se o alvo for Lobisomem, o alvo morre; se não for, o Denunciador morre.",
  lycan: "Faz parte dos Aldeões, mas aparece como Lobisomem para a Vidente.",
  cursed: "Começa como Aldeão. Uma eliminação pelos Lobisomens deixa a conversão pendente; o moderador a efetiva ao despertá-lo discretamente na noite seguinte.",
  spellcaster: "Silencia um jogador durante todo o dia seguinte, não podendo repetir o alvo em dias consecutivos.",
  villager: "Não tem ação noturna; participa da discussão e vota para eliminar Lobisomens.",
};
const ROLE_SUMMARIES: Record<RoleId, string> = {
  werewolf: "Todas as noites, acorde junto com os outros Lobisomens e escolha um jogador para eliminar.",
  bodyguard: "Todas as noites, escolha um jogador que não possa ser eliminado naquela noite.",
  witch: "Você pode optar por salvar e/ou eliminar um jogador à noite, uma única vez por jogo.",
  seer: "Todas as noites, escolha um jogador para descobrir se ele é um Aldeão ou um Lobisomem.",
  revealer: "Todas as noites, você pode optar por denunciar um jogador. Se esse jogador for um Lobisomem, ele é eliminado. Se não for, você é eliminado.",
  lycan: "Você é um Aldeão, mas, aos olhos do Vidente, parece ser um Lobisomem.",
  cursed: "Você faz parte da Facção dos Aldeões, a menos que seja alvo de eliminação pelos Lobisomens; nesse caso, você se torna um Lobisomem.",
  spellcaster: "Todas as noites, escolha um jogador que não poderá falar no dia seguinte.",
  villager: "Encontre os Lobisomens e elimine-os.",
};
const ROLE_MORE_INFO: Partial<Record<RoleId, readonly string[]>> = {
  werewolf: [
    "Proteção do Guarda-costas ou da Bruxa bloqueia o ataque.",
    "Se atacar o Amaldiçoado sem proteção e a Bruxa não o atacar, ele sobrevive com conversão pendente. Se a Bruxa também o atacar, ele morre sem conversão.",
  ],
  bodyguard: [
    "Protege de ataques dos Lobisomens, da Bruxa e do Denunciador; não impede exílio nem pode repetir o mesmo alvo em noites seguidas.",
    "Proteger o Amaldiçoado impede que a conversão fique pendente.",
  ],
  witch: [
    "Cada poder só pode ser usado uma vez; o uso é consumido mesmo se for bloqueado ou redundante. Se usar ambos, escolha alvos diferentes.",
    "Se atacar o Amaldiçoado na mesma noite que os Lobisomens, ele morre sem conversão. Proteção bloqueia os ataques.",
  ],
  seer: [
    "Não pode investigar outra Vidente. O Lycan aparece como Lobisomem, embora pertença aos Aldeões.",
    "O Amaldiçoado só aparece como Lobisomem depois de ser despertado, quando a conversão se efetiva.",
  ],
  revealer: [
    "Denunciar um Lobisomem desprotegido o elimina; se o alvo não for Lobisomem, o Denunciador morre, a menos que esteja protegido.",
    "Proteger o alvo denunciado não salva o Denunciador.",
  ],
  spellcaster: [
    "Não pode silenciar o mesmo alvo em dias seguidos. O alvo continua votando, mas sem falar.",
    "O silenciamento não bloqueia ações noturnas e continua valendo no dia seguinte mesmo se o alvo for eliminado naquela noite.",
  ],
};
const ROLE_FACTIONS: Record<RoleId, string> = {
  werewolf: "Facção dos Lobisomens",
  bodyguard: "Facção dos Aldeões",
  witch: "Facção dos Aldeões",
  seer: "Facção dos Aldeões",
  revealer: "Facção dos Aldeões",
  lycan: "Facção dos Aldeões",
  cursed: "Aldeões; Lobisomens se convertido",
  spellcaster: "Facção dos Aldeões",
  villager: "Facção dos Aldeões",
};
const ROLE_TEAMS = [
  { id: "werewolves", label: "Time dos Lobisomens", roles: ["werewolf"] },
  {
    id: "villagers",
    label: "Time dos Aldeões",
    roles: ["bodyguard", "witch", "seer", "revealer", "lycan", "cursed", "spellcaster", "villager"],
  },
] as const satisfies readonly { id: string; label: string; roles: readonly RoleId[] }[];

function RoleCountField({
  role,
  value,
  onChange,
}: {
  role: RoleId;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = useId();

  return (
    <div className="role-count">
      <label htmlFor={inputId}>{ROLE_LABELS[role]}</label>
      <details className="role-info">
        <summary aria-label={`Informações sobre ${ROLE_LABELS[role]}`}>i</summary>
        <span>{ROLE_DESCRIPTIONS[role]}</span>
      </details>
      <input
        id={inputId}
        aria-label={`Quantidade de ${ROLE_LABELS[role]}`}
        max={role === "cursed" || role === "revealer" ? 1 : 75}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </div>
  );
}

function RoleCountGroups({
  roleCounts,
  onChange,
}: {
  roleCounts: Record<RoleId, number>;
  onChange: (role: RoleId, value: number) => void;
}) {
  return (
    <>
      {ROLE_TEAMS.map((team) => (
        <fieldset className="role-team" key={team.id}>
          <legend>{team.label}</legend>
          <div className="role-counts">
            {team.roles.map((role) => (
              <RoleCountField
                key={role}
                onChange={(value) => onChange(role, value)}
                role={role}
                value={roleCounts[role]}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}

function RoleIllustration({ role }: { role: RoleId }) {
  return (
    <svg aria-hidden="true" className={`role-illustration role-illustration-${role}`} viewBox="0 0 120 120">
      {role === "werewolf" && (
        <>
          <path d="m29 47-8-29 28 15c7-3 15-3 22 0l28-15-8 29c7 10 8 24 1 36-8 15-20 23-32 23S36 98 28 83c-7-12-6-26 1-36Z" />
          <path d="m39 60 12 4m30-4-12 4M48 78l12 5 12-5" />
        </>
      )}
      {role === "bodyguard" && (
        <>
          <path d="M60 13 96 27v27c0 25-15 43-36 54C39 97 24 79 24 54V27l36-14Z" />
          <path d="M60 34v48M42 58h36" />
        </>
      )}
      {role === "witch" && (
        <>
          <path d="m23 72 69-2-20-18-8-34-20 30-21 24Z" />
          <path d="M20 78c12-8 26-8 40-3 14 5 28 5 40-2-7 18-21 27-40 27S27 91 20 78Z" />
          <path d="m85 23 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
        </>
      )}
      {role === "seer" && (
        <>
          <path d="M13 60s17-28 47-28 47 28 47 28-17 28-47 28-47-28-47-28Z" />
          <circle cx="60" cy="60" r="15" />
          <circle cx="60" cy="60" r="5" />
        </>
      )}
      {role === "revealer" && (
        <>
          <path d="M17 60s16-27 43-27 43 27 43 27-16 27-43 27-43-27-43-27Z" />
          <circle cx="60" cy="60" r="13" />
          <path d="M60 52v11m0 8h.1M91 25l4 9 10 1-8 7 2 10-8-5-9 5 3-10-8-7 10-1 4-9Z" />
        </>
      )}
      {role === "lycan" && (
        <>
          <path d="M77 18c-6 7-10 17-10 28 0 24 19 43 43 43 2 0 4 0 6-.4-8 17-26 29-46 29-28 0-51-23-51-51 0-27 21-49 48-51-1 1-1 2-1 2Z" />
          <path d="m91 24 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
        </>
      )}
      {role === "cursed" && (
        <>
          <path d="M78 17c-25 2-43 23-43 48 0 25 20 45 45 45 11 0 21-4 29-11-6 2-12 3-18 2-24-3-41-24-38-48 2-16 12-29 25-36Z" />
          <path d="m27 36 4 9 10 1-8 7 2 10-8-5-9 5 3-10-8-7 10-1 4-9Z" />
        </>
      )}
      {role === "spellcaster" && (
        <>
          <circle cx="60" cy="60" r="43" />
          <circle cx="45" cy="49" r="3" />
          <circle cx="75" cy="49" r="3" />
          <path d="m51 69 18 16m0-16L51 85" />
        </>
      )}
      {role === "villager" && (
        <>
          <circle cx="60" cy="43" r="20" />
          <path d="M22 104c3-24 18-37 38-37s35 13 38 37H22Z" />
          <path d="M45 77h30" />
        </>
      )}
    </svg>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

function makeMatch(game: Game, roleCounts: Record<RoleId, number>, dayDurationMinutes: number) {
  return createMatch({
    id: game.id,
    name: game.name,
    players: game.players,
    roleCounts,
    dayDurationMinutes,
  });
}

function getRoleCounts(players: MatchPlayer[]): Record<RoleId, number> {
  return players.reduce<Record<RoleId, number>>((counts, player) => {
    counts[player.convertedFromCursed ? "cursed" : player.role] += 1;
    return counts;
  }, {
    werewolf: 0,
    bodyguard: 0,
    witch: 0,
    seer: 0,
    revealer: 0,
    lycan: 0,
    cursed: 0,
    spellcaster: 0,
    villager: 0,
  });
}

function playerName(match: MatchState, playerId: string): string {
  return match.players.find((player) => player.id === playerId)?.name ?? "Participante";
}

function formatNightAction(match: MatchState, action: NightAction): string {
  switch (action.kind) {
    case "werewolf-attack":
      return `Ataque: ${playerName(match, action.targetId)}`;
    case "bodyguard-protect":
      return `Proteção: ${playerName(match, action.targetId)}`;
    case "seer-investigate":
      return `Investigação: ${playerName(match, action.targetId)}`;
    case "revealer-denounce":
      return `Denúncia: ${playerName(match, action.targetId)}`;
    case "spellcaster-silence":
      return `Silenciamento: ${playerName(match, action.targetId)}`;
    case "witch":
      return [
        action.protectTargetId
          ? `protegeu ${playerName(match, action.protectTargetId)}`
          : "",
        action.eliminateTargetId
          ? `eliminou ${playerName(match, action.eliminateTargetId)}`
          : "",
      ].filter(Boolean).join(" e ") || "Nenhum poder usado";
  }
}

function PlayerPicker({
  id,
  label,
  players,
  isAllowed,
  disabled = false,
  required = true,
  unavailableReason,
  value,
  onChange,
  toggleSelectedOff = false,
}: {
  id: string;
  label: string;
  players: MatchPlayer[];
  isAllowed: (player: MatchPlayer) => boolean;
  disabled?: boolean;
  required?: boolean;
  unavailableReason: (player: MatchPlayer) => string;
  value: string;
  onChange: (value: string) => void;
  toggleSelectedOff?: boolean;
}) {
  return (
    <fieldset className="player-picker">
      <legend>{label}</legend>
      <div className="player-choice-grid">
        {players.map((player) => {
          const allowed = !disabled && isAllowed(player);
          return (
            <label
              className={`player-choice${allowed ? "" : " unavailable"}${value === player.id ? " selected" : ""}`}
              key={player.id}
              title={allowed ? player.name : unavailableReason(player)}
            >
              <input
                checked={value === player.id}
                disabled={!allowed}
                name={id}
                onChange={() => onChange(toggleSelectedOff && value === player.id ? "" : player.id)}
                required={required && allowed}
                type={toggleSelectedOff ? "checkbox" : "radio"}
                value={player.id}
              />
              <span className="player-choice-name">{player.name}</span>
              <span className="player-choice-status">
                {player.status === "alive"
                  ? allowed
                    ? "Disponível"
                    : unavailableReason(player)
                  : player.status === "dead" ? "Morto" : "Exilado"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function NightActionForm({
  match,
  role,
  initialAction,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  match: MatchState;
  role: NightRole;
  initialAction?: NightAction;
  onSubmit: (action?: NightAction) => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const action = initialAction;
  const [targetId, setTargetId] = useState(
    action && "targetId" in action ? action.targetId : "",
  );
  const [protectTargetId, setProtectTargetId] = useState(
    action?.kind === "witch" ? action.protectTargetId ?? "" : "",
  );
  const [eliminateTargetId, setEliminateTargetId] = useState(
    action?.kind === "witch" ? action.eliminateTargetId ?? "" : "",
  );
  const [error, setError] = useState("");

  function isAllowedTarget(player: MatchPlayer, targetRole: NightRole, otherTargetId = ""): boolean {
    if (player.status !== "alive" || player.id === otherTargetId) return false;
    if (targetRole === "werewolf") return player.role !== "werewolf";
    if (targetRole === "seer") return player.role !== "seer";
    if (targetRole === "revealer") {
      return player.id !== match.players.find((candidate) => candidate.role === "revealer")?.id;
    }
    if (targetRole === "bodyguard") return player.id !== match.lastBodyguardTargetId;
    if (targetRole === "spellcaster") return player.id !== match.lastSpellcasterTargetId;
    return true;
  }

  function unavailableReason(player: MatchPlayer, targetRole: NightRole, otherTargetId = ""): string {
    if (player.status === "dead") return "Eliminado";
    if (player.status === "exiled") return "Exilado";
    if (player.id === otherTargetId) return "Escolha outro alvo para usar os dois poderes";
    if (targetRole === "werewolf" && player.role === "werewolf") return "Não pode escolher outro Lobisomem";
    if (targetRole === "seer" && player.role === "seer") return "Não pode investigar alguém do próprio grupo";
    if (
      targetRole === "revealer" &&
      player.id === match.players.find((candidate) => candidate.role === "revealer")?.id
    ) return "O Denunciador não pode escolher a si mesmo";
    if (targetRole === "bodyguard" && player.id === match.lastBodyguardTargetId) return "Protegido na noite anterior";
    if (targetRole === "spellcaster" && player.id === match.lastSpellcasterTargetId) return "Silenciado no dia anterior";
    if (targetRole === "witch" && player.role === "witch") return "Não pode eliminar alguém do próprio grupo";
    return "Indisponível";
  }

  const allowedTargets = match.players.filter((player) => isAllowedTarget(player, role));

  function submitAction(nextAction?: NightAction) {
    setError("");
    try {
      onSubmit(nextAction);
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let nextAction: NightAction | undefined;
    if (role === "witch") {
      if (protectTargetId || eliminateTargetId) {
        nextAction = {
          kind: "witch",
          ...(protectTargetId ? { protectTargetId } : {}),
          ...(eliminateTargetId ? { eliminateTargetId } : {}),
        };
      }
    } else if (role === "werewolf") {
      nextAction = { kind: "werewolf-attack", targetId };
    } else if (role === "bodyguard") {
      nextAction = { kind: "bodyguard-protect", targetId };
    } else if (role === "seer") {
      nextAction = { kind: "seer-investigate", targetId };
    } else if (role === "revealer") {
      nextAction = { kind: "revealer-denounce", targetId };
    } else {
      nextAction = { kind: "spellcaster-silence", targetId };
    }

    submitAction(nextAction);
  }

  if (role === "witch" && match.players.some(
    (player) => player.role === role && player.status === "alive",
  )) {
    return (
      <form className="action-form" onSubmit={handleSubmit}>
        <p className="field-hint">
          Os usos são compartilhados e opcionais. Deixe sem selecionar para não usar o poder.
        </p>
        <PlayerPicker
          id="witch-protect-target"
          label={`Proteção${match.witchResources.protectionUsed ? " (já usada)" : ""}`}
          isAllowed={(player) => isAllowedTarget(player, "witch", eliminateTargetId)}
          onChange={(id) => {
            setProtectTargetId(id);
            if (id === eliminateTargetId) setEliminateTargetId("");
          }}
          disabled={match.witchResources.protectionUsed}
          players={match.players}
          required={false}
          toggleSelectedOff
          unavailableReason={(player) =>
            match.witchResources.protectionUsed
              ? "Uso de proteção já gasto"
              : unavailableReason(player, "witch", eliminateTargetId)
          }
          value={protectTargetId}
        />
        {protectTargetId && !match.witchResources.protectionUsed && (
          <button className="text-button clear-target" onClick={() => setProtectTargetId("")} type="button">
            Não usar proteção
          </button>
        )}
        <PlayerPicker
          id="witch-eliminate-target"
          label={`Eliminação${match.witchResources.eliminationUsed ? " (já usada)" : ""}`}
          isAllowed={(player) =>
            isAllowedTarget(player, "witch", protectTargetId) && player.role !== "witch"
          }
          onChange={(id) => {
            setEliminateTargetId(id);
            if (id === protectTargetId) setProtectTargetId("");
          }}
          disabled={match.witchResources.eliminationUsed}
          players={match.players}
          required={false}
          toggleSelectedOff
          unavailableReason={(player) =>
            match.witchResources.eliminationUsed
              ? "Uso de eliminação já gasto"
              : player.status === "alive" && player.role === "witch"
                ? "Não pode eliminar alguém do próprio grupo"
                : unavailableReason(player, "witch", protectTargetId)
          }
          value={eliminateTargetId}
        />
        {eliminateTargetId && !match.witchResources.eliminationUsed && (
          <button className="text-button clear-target" onClick={() => setEliminateTargetId("")} type="button">
            Não usar eliminação
          </button>
        )}
        {error && <p className="message error-message" role="alert">{error}</p>}
        <div className="button-row">
          <button className="primary-button" type="submit">{submitLabel}</button>
          {onCancel && <button className="secondary-button" onClick={onCancel} type="button">Cancelar</button>}
        </div>
      </form>
    );
  }

  const targetLabel = role === "werewolf"
    ? "Vítima escolhida pelo grupo"
    : role === "bodyguard"
      ? "Pessoa protegida"
      : role === "seer"
        ? "Pessoa investigada"
        : role === "revealer"
          ? "Pessoa denunciada"
          : "Pessoa silenciada no dia seguinte";

  return (
    <form className="action-form" onSubmit={handleSubmit}>
      {role === "spellcaster" && (
        <p className="field-hint">
          Depois de registrar a escolha, aproxime-se sem fazer barulho e toque no ombro do alvo.
          A pessoa continua votando, mas não pode falar até o fim da votação.
        </p>
      )}
      {role === "revealer" && (
        <p className="field-hint">
          A denúncia é opcional. Se o alvo não for Lobisomem, o Denunciador será eliminado, salvo se estiver protegido.
        </p>
      )}
      {allowedTargets.length === 0 && (
        <p className="message error-message" role="alert">
          Não há alvo válido disponível para esta chamada.
        </p>
      )}
      <PlayerPicker
        id="night-target"
        label={targetLabel}
        isAllowed={(player) => isAllowedTarget(player, role)}
        onChange={setTargetId}
        players={match.players}
        unavailableReason={(player) => unavailableReason(player, role)}
        value={targetId}
      />
      {error && <p className="message error-message" role="alert">{error}</p>}
      <div className="button-row">
        {role === "revealer" && (
          <button className="secondary-button" onClick={() => submitAction()} type="button">
            Não denunciar esta noite
          </button>
        )}
        <button className="primary-button" disabled={allowedTargets.length === 0} type="submit">
          {submitLabel}
        </button>
        {onCancel && <button className="secondary-button" onClick={onCancel} type="button">Cancelar</button>}
      </div>
    </form>
  );
}

function MasterConsole({
  initialMatch,
  initialGame,
  onReplay,
  onEditPrepared,
  onExit,
}: {
  initialMatch: MatchState;
  initialGame: Game;
  onReplay: (game: Game, roleCounts: Record<RoleId, number>) => Promise<void>;
  onEditPrepared: (
    game: Game,
    roleCounts: Record<RoleId, number>,
    restart: boolean,
    currentMatch: MatchState,
  ) => Promise<MatchState>;
  onExit: () => void;
}) {
  const [match, setMatch] = useState(initialMatch);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<NightRole | null>(null);
  const [editingReplay, setEditingReplay] = useState(false);
  const [editingPreparation, setEditingPreparation] = useState(false);
  const [voteChoice, setVoteChoice] = useState("");
  const [storageStatus, setStorageStatus] = useState<"saved" | "saving" | "error">("saved");
  const [storageError, setStorageError] = useState("");
  const [now, setNow] = useState(Date.now);
  const savingRef = useRef(false);
  const statusRef = useRef(storageStatus);

  function persist(next: MatchState) {
    savingRef.current = true;
    statusRef.current = "saving";
    setStorageStatus("saving");
    setStorageError("");
    void saveMatch(next).then(() => {
      statusRef.current = "saved";
      setStorageStatus("saved");
    }).catch((saveError: unknown) => {
      statusRef.current = "error";
      setStorageStatus("error");
      setStorageError(errorMessage(saveError));
    }).finally(() => {
      savingRef.current = false;
    });
  }

  useEffect(() => {
    if (match !== initialMatch || !isVotingDecided(match)) return;
    const resolved = resolveVoting(match).match;
    setMatch(resolved);
    persist(resolved);
  }, [initialMatch, match]);

  useEffect(() => {
    if (match.phase !== "discussion" || match.discussion?.status !== "running") return;
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(timerId);
  }, [match.phase, match.discussion?.status]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (statusRef.current === "saved") return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  useEffect(() => {
    if (match.phase !== "discussion" || match.discussion?.status !== "running") return;
    if (match.discussion.startedAtMs === null ||
        now - match.discussion.startedAtMs < match.discussion.remainingMs ||
        savingRef.current || storageStatus === "error") return;
    const expired = updateDiscussionClock(match, now);
    setMatch(expired);
    persist(expired);
  }, [match, now, storageStatus]);

  function transition(change: (current: MatchState) => MatchState): boolean {
    if (savingRef.current || statusRef.current === "error") return false;
    setError("");
    try {
      const next = change(match);
      setMatch(next);
      persist(next);
      return true;
    } catch (transitionError: unknown) {
      setError(errorMessage(transitionError));
      return false;
    }
  }

  function handleNightAction(role: NightRole, action?: NightAction, revise = false) {
    const succeeded = transition((current) =>
      revise
        ? reviseNightAction(current, role, action)
        : submitNightCall(current, role, action),
    );
    if (succeeded) setEditingRole(null);
  }

  function handleNightResolution() {
    if (transition((current) => resolveNight(current).match)) setEditingRole(null);
  }

  function handleRestartMatch() {
    if (!window.confirm(
      "Reiniciar a partida? O andamento atual será apagado e as funções serão sorteadas novamente.",
    )) return;
    transition((current) => createMatch({
      id: current.id,
      name: current.name,
      players: current.players.map(({ id, name }) => ({ id, name })),
      roleCounts: getRoleCounts(current.players),
      dayDurationMinutes: current.dayDurationMinutes,
    }));
    setEditingRole(null);
    setVoteChoice("");
  }

  async function handleReplay(game: Game, roleCounts: Record<RoleId, number>) {
    setError("");
    try {
      await onReplay(game, roleCounts);
    } catch (replayError: unknown) {
      setError(errorMessage(replayError));
    }
  }

  async function handlePreparedEdit(
    game: Game,
    roleCounts?: Record<RoleId, number>,
    restart = false,
  ) {
    setError("");
    try {
      const updatedMatch = await onEditPrepared(
        game,
        roleCounts ?? getRoleCounts(match.players),
        restart,
        match,
      );
      setMatch(updatedMatch);
      setEditingPreparation(false);
    } catch (editError: unknown) {
      setError(errorMessage(editError));
    }
  }

  function handleVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const voterId = match.voting?.order[match.voting.nextVoterIndex];
    if (!voterId) return;
    const choice: VoteChoice = voteChoice === "annul"
      ? { kind: "annul" }
      : { kind: "player", playerId: voteChoice };
    if (transition((current) => {
      const recorded = recordVote(current, voterId, choice);
      return isVotingDecided(recorded) ? resolveVoting(recorded).match : recorded;
    })) {
      setVoteChoice("");
    }
  }

  const phaseLabels: Record<MatchState["phase"], string> = {
    prepared: "Preparação",
    night: "Noite",
    "seer-result": "Resultado da investigação",
    "night-resolution": "Confirmação da noite",
    dawn: "Amanhecer",
    discussion: "Discussão",
    voting: "Votação",
    "ready-for-night": "Pronta para a próxima noite",
    finished: "Partida encerrada",
  };
  const alivePlayers = match.players.filter((player) => player.status === "alive");
  const currentRole = match.night?.schedule[match.night.nextCallIndex];
  const currentVoterId = match.voting?.order[match.voting.nextVoterIndex];
  const liveVoteCounts = match.voting?.votes.reduce<Record<string, number>>((counts, vote) => {
    const key = vote.choice.kind === "annul" ? "annul" : vote.choice.playerId;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}) ?? {};
  const latestNight = [...match.history].reverse().find(
    (entry): entry is NightHistoryEntry => entry.type === "night-resolved",
  );
  const latestSpellcasterAction = latestNight?.actions.find(
    (record) => record.action.kind === "spellcaster-silence",
  );
  const silencedPlayerId = latestSpellcasterAction?.action.kind === "spellcaster-silence"
    ? latestSpellcasterAction.action.targetId
    : undefined;
  const latestVote = [...match.history].reverse().find(
    (entry) => entry.type === "vote-resolved",
  );
  const remainingMs = match.discussion?.status === "running" && match.discussion.startedAtMs !== null
    ? Math.max(0, match.discussion.remainingMs - Math.max(0, now - match.discussion.startedAtMs))
    : match.discussion?.remainingMs ?? 0;
  const timeLabel = `${String(Math.floor(remainingMs / 60_000)).padStart(2, "0")}:${String(
    Math.floor((remainingMs % 60_000) / 1_000),
  ).padStart(2, "0")}`;

  return (
    <section className="master-console" aria-labelledby="console-title">
      <div className="privacy-banner" role="note">
        <strong>TELA PRIVADA DO MESTRE</strong>
        <span>Papéis, ações, votos e resultados abaixo são secretos. Não projete nem mostre esta tela aos participantes.</span>
        <span>Os dados ficam apenas neste navegador e dispositivo; eles podem ser perdidos se os dados locais forem apagados.</span>
        <span>Use apenas uma aba para conduzir esta partida; alterações simultâneas não são conciliadas.</span>
      </div>

      <div className="console-heading">
        <div>
          <p className="eyebrow">{match.name} · NOITE {match.round || 1}</p>
          <h2 id="console-title">{phaseLabels[match.phase]}</h2>
        </div>
        <div className="console-heading-actions">
          <button
            className="danger-button"
            disabled={storageStatus !== "saved"}
            onClick={handleRestartMatch}
            type="button"
          >
            Reiniciar partida
          </button>
          <button className="secondary-button" disabled={storageStatus === "saving"} onClick={() => {
            if (storageStatus !== "error" || window.confirm("As últimas alterações não foram salvas. Sair e perdê-las?")) {
              onExit();
            }
          }} type="button">
            Voltar às partidas
          </button>
        </div>
      </div>

      {error && <p className="message error-message" role="alert">{error}</p>}
      {storageStatus === "error" ? (
        <div className="message error-message" role="alert">
          <p>Não foi possível salvar o progresso: {storageError} As alterações continuam nesta tela, mas serão perdidas ao sair.</p>
          <button className="secondary-button" onClick={() => persist(match)} type="button">Tentar salvar novamente</button>
        </div>
      ) : (
        <p className="field-hint" role="status">{storageStatus === "saving" ? "Salvando progresso..." : "Progresso salvo neste dispositivo."}</p>
      )}

      <fieldset className="console-controls" disabled={storageStatus !== "saved"}>
      {match.phase === "prepared" && (
        <section className="phase-panel">
          {editingPreparation ? (
            <GameEditor
              game={initialGame}
              match={match}
              onCancel={() => setEditingPreparation(false)}
              onSave={handlePreparedEdit}
              submitLabel="Salvar alterações"
            />
          ) : (
            <>
              <h3>Distribuição secreta</h3>
              <p>O sorteio é exibido somente nesta tela do mestre. Entregue as cartas físicas aos participantes.</p>
              <PlayerRoster match={match} />
              <button
                className="secondary-button"
                onClick={() => setEditingPreparation(true)}
                type="button"
              >
                Editar partida
              </button>
              <button
                className="secondary-button"
                onClick={() => transition((current) => {
                  if (current.phase !== "prepared") {
                    throw new Error("O sorteio só pode ser refeito antes de iniciar a partida.");
                  }
                  return createMatch({
                    id: current.id,
                    name: current.name,
                    players: current.players.map(({ id, name }) => ({ id, name })),
                    roleCounts: getRoleCounts(current.players),
                    dayDurationMinutes: current.dayDurationMinutes,
                  });
                })}
                type="button"
              >
                Sortear funções novamente
              </button>
              <button
                className="primary-button"
                onClick={() => transition((current) => startMatch(current))}
                type="button"
              >
                Iniciar a partida
              </button>
            </>
          )}
        </section>
      )}

      {match.phase === "night" && currentRole && !match.night?.awakeningRequired && (
        <section className="phase-panel">
          <p className="step-number">{String(match.night!.nextCallIndex + 1).padStart(2, "0")}</p>
          <h3>Chamar: {ROLE_LABELS[currentRole]}</h3>
          <p>
            {currentRole === "revealer"
              ? "Chame o Denunciador e registre a escolha individual dele."
              : "Oriente o grupo a agir em conjunto e registre uma única escolha final."}
          </p>
          <div className="called-role-players">
            <p className="detail-label">JOGADORES DESTA FUNÇÃO</p>
            <ul>
              {match.players
                .filter((player) => player.role === currentRole)
                .map((player) => (
                  <li className={player.status === "alive" ? "" : "inactive"} key={player.id}>
                    <span>{player.name}</span>
                    <span>{player.status === "alive" ? "Vivo" : player.status === "dead" ? "Morto" : "Exilado"}</span>
                  </li>
                ))}
            </ul>
          </div>
          {editingRole ? (
            <NightActionForm
              key={`revise-${editingRole}`}
              initialAction={match.night?.actions.find((record) => record.role === editingRole)?.action}
              match={match}
              onCancel={() => setEditingRole(null)}
              onSubmit={(action) => handleNightAction(editingRole, action, true)}
              role={editingRole}
              submitLabel="Salvar correção"
            />
          ) : match.players.some(
            (player) => player.role === currentRole && player.status === "alive",
          ) ? (
            <NightActionForm
              key={`${match.round}-${currentRole}-${match.night!.nextCallIndex}`}
              match={match}
              onSubmit={(action) => handleNightAction(currentRole, action)}
              role={currentRole}
              submitLabel="Registrar chamada e avançar"
            />
          ) : (
            <>
              <p className="message">Nenhum participante vivo nesta função. Mantenha a chamada sem registrar ação.</p>
              <button
                className="primary-button"
                onClick={() => handleNightAction(currentRole)}
                type="button"
              >
                Avançar sem ação
              </button>
            </>
          )}
        </section>
      )}

      {match.phase === "night" && match.night?.awakeningRequired && (
        <section className="phase-panel">
          <h3>Despertar discreto</h3>
          <p>
            Antes de chamar os Lobisomens, acorde discretamente{" "}
            <strong>
              {match.players.find((player) =>
                player.status === "alive" && player.pendingCursedConversion,
              )?.name ?? "o Amaldiçoado"}
            </strong>
            . Ele só passa a ser Lobisomem e saberá da conversão a partir deste momento.
          </p>
          <p>Não revele a conversão ao grupo. Depois de acordá-lo em particular, confirme para iniciar a chamada dos Lobisomens.</p>
          <button
            className="primary-button"
            onClick={() => transition((current) => awakenCursed(current))}
            type="button"
          >
            Acordei discretamente o Amaldiçoado
          </button>
        </section>
      )}

      {match.phase === "seer-result" && match.night && (
        <section className="phase-panel">
          <h3>Resultado da investigação</h3>
          {match.night.actions
            .filter((record) => record.role === "seer" && record.action.kind === "seer-investigate")
            .map(({ action }) => {
              if (action.kind !== "seer-investigate") return null;
              const target = match.players.find((player) => player.id === action.targetId);
              if (!target) return <p className="message error-message" key={action.targetId}>Não foi possível localizar a pessoa investigada.</p>;
              return (
                <p key={action.targetId}>
                  <strong>{target.name}</strong>{" "}
                  {appearsAsWerewolfToSeer(target.role) ? "é Lobisomem." : "não é Lobisomem."}
                </p>
              );
            })}
          <p>Informe o resultado à Vidente e peça que durma novamente.</p>
          <button
            className="primary-button"
            onClick={() => transition((current) => continueAfterSeerResult(current))}
            type="button"
          >
            Vidente pode dormir novamente
          </button>
        </section>
      )}

      {match.phase === "night-resolution" && match.night && (
        <section className="phase-panel">
          <h3>Revisar ações antes de confirmar</h3>
          <p>Esta revisão é a última oportunidade de corrigir as ações da noite.</p>
          {match.night.actions.map(({ role, action }) =>
            role === "spellcaster" && action.kind === "spellcaster-silence" ? (
              <p className="message" key="spellcaster-reminder">
                <strong>Lembrete:</strong> aproxime-se sem fazer barulho e toque no ombro de{" "}
                {playerName(match, action.targetId)} para sinalizar o silenciamento. Mantenha a escolha privada.
              </p>
            ) : null,
          )}
          {match.night.actions.length === 0 ? (
            <p className="empty-state compact">Nenhuma ação foi registrada.</p>
          ) : (
            <ul className="private-list">
              {match.night.actions.map(({ role, action }) => (
                <li key={role}>
                  <span><strong>{ROLE_LABELS[role]}</strong><span>{formatNightAction(match, action)}</span></span>
                  {role !== "seer" && (
                    <button className="text-button" onClick={() => setEditingRole(role)} type="button">Editar</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {editingRole && (
            <NightActionForm
              key={`review-${editingRole}`}
              initialAction={match.night.actions.find((record) => record.role === editingRole)?.action}
              match={match}
              onCancel={() => setEditingRole(null)}
              onSubmit={(action) => handleNightAction(editingRole, action, true)}
              role={editingRole}
              submitLabel="Salvar correção"
            />
          )}
          <button className="primary-button" onClick={handleNightResolution} type="button">
            Confirmar resolução da noite
          </button>
        </section>
      )}

      {match.phase === "dawn" && latestNight && (
        <section className="phase-panel">
          <h3>Resultado privado da noite</h3>
          <p className="public-script">
            <strong>Para anunciar:</strong>{" "}
            {latestNight.eliminatedPlayerIds.length
              ? `foram eliminados: ${latestNight.eliminatedPlayerIds.map((id) => playerName(match, id)).join(", ")}.`
              : "ninguém foi eliminado durante a noite."}
          </p>
          <p className="field-label">Investigações da Vidente (privado)</p>
          {latestNight.investigations.length ? (
            <ul className="private-list">
              {latestNight.investigations.map((result) => (
                <li key={result.targetId}>
                  <span><strong>{playerName(match, result.targetId)}</strong><span>{result.isWerewolf ? "É Lobisomem" : "Não é Lobisomem"}</span></span>
                </li>
              ))}
            </ul>
          ) : <p className="field-hint">Nenhuma investigação registrada.</p>}
          {(latestNight.pendingCursedConversionPlayerIds?.length ?? 0) > 0 && (
            <p className="message">
              Informação privada do mestre: a conversão de{" "}
              {(latestNight.pendingCursedConversionPlayerIds ?? []).map((id) => playerName(match, id)).join(", ")}{" "}
              está pendente. Mantenha em segredo até despertá-lo discretamente na próxima noite.
            </p>
          )}
          {silencedPlayerId && (
            <p className="message">
              <strong>Silenciamento (privado):</strong> {playerName(match, silencedPlayerId)} não pode falar
              até o fim da votação. Aproxime-se sem fazer barulho e toque no ombro da pessoa; não revele o alvo.
            </p>
          )}
          <PlayerRoster match={match} />
          <button
            className="primary-button"
            onClick={() => transition((current) => startDiscussion(current, Date.now()))}
            type="button"
          >
            Abrir discussão e iniciar temporizador
          </button>
        </section>
      )}

      {match.phase === "discussion" && match.discussion && (
        <section className="phase-panel timer-panel">
          <h3>Discussão</h3>
          {silencedPlayerId && match.players.some(
            (player) => player.id === silencedPlayerId && player.status === "alive",
          ) && (
            <p className="message">
              <strong>Silenciado (privado):</strong> {playerName(match, silencedPlayerId)} não pode falar
              até o fim da votação. Aproxime-se sem fazer barulho e toque no ombro da pessoa; mantenha o alvo em segredo.
            </p>
          )}
          <p className="timer-display" role="timer" aria-live="off">{timeLabel}</p>
          <p>
            {match.discussion.status === "expired"
              ? "Tempo esgotado. A votação só começa quando o mestre decidir."
              : match.discussion.status === "paused"
                ? "Temporizador pausado."
                : match.discussion.status === "ended"
                  ? "Discussão encerrada."
                  : "Temporizador em andamento."}
          </p>
          <div className="button-row">
            {match.discussion.status === "running" && (
              <>
                <button className="secondary-button" onClick={() => transition((current) => pauseDiscussion(current, Date.now()))} type="button">Pausar</button>
                <button className="secondary-button" onClick={() => transition((current) => endDiscussion(current, Date.now()))} type="button">Encerrar discussão</button>
              </>
            )}
            {match.discussion.status === "paused" && (
              <>
                <button className="secondary-button" onClick={() => transition((current) => resumeDiscussion(current, Date.now()))} type="button">Retomar</button>
                <button className="secondary-button" onClick={() => transition((current) => endDiscussion(current, Date.now()))} type="button">Encerrar discussão</button>
              </>
            )}
            {(match.discussion.status === "ended" || match.discussion.status === "expired") && (
              <>
                <button className="primary-button" onClick={() => transition((current) => startVoting(current))} type="button">
                  Iniciar votação
                </button>
                <button className="secondary-button" onClick={() => transition((current) => skipVoting(current))} type="button">
                  Pular votação e iniciar noite
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {match.phase === "voting" && match.voting && (
        <section className="phase-panel">
          <h3>{currentVoterId
            ? `Voto ${match.voting.nextVoterIndex + 1} de ${match.voting.order.length}`
            : "Todos os votos foram registrados"}</h3>
          {silencedPlayerId && match.players.some(
            (player) => player.id === silencedPlayerId && player.status === "alive",
          ) && (
            <p className="message">
              <strong>Silenciado (privado):</strong> {playerName(match, silencedPlayerId)} não pode falar,
              mas continua votando. Registre a escolha sem fala e mantenha o alvo em segredo.
            </p>
          )}
          {currentVoterId ? (
            <>
              <p>Registre em privado o voto aberto de <strong>{playerName(match, currentVoterId)}</strong>.</p>
              <form className="action-form" onSubmit={handleVote}>
                <fieldset className="player-picker">
                  <legend>Voto · votos registrados até agora</legend>
                  <div className="player-choice-grid">
                    {alivePlayers.map((player) => {
                      const canVoteFor = player.id !== currentVoterId;
                      return (
                        <label
                          className={`player-choice${canVoteFor ? "" : " unavailable"}${voteChoice === player.id ? " selected" : ""}`}
                          key={player.id}
                          title={canVoteFor ? player.name : "Não pode votar em si mesmo"}
                        >
                          <input
                            checked={voteChoice === player.id}
                            disabled={!canVoteFor}
                            name="vote-choice"
                            onChange={() => setVoteChoice(player.id)}
                            required={canVoteFor}
                            type="radio"
                            value={player.id}
                          />
                          <span className="player-choice-name">{player.name}</span>
                          <span className="player-choice-status">
                            {canVoteFor ? "Votos" : "Não pode votar em si"} · {liveVoteCounts[player.id] ?? 0}
                          </span>
                        </label>
                      );
                    })}
                    <label className={`player-choice${voteChoice === "annul" ? " selected" : ""}`}>
                      <input
                        checked={voteChoice === "annul"}
                        name="vote-choice"
                        onChange={() => setVoteChoice("annul")}
                        required
                        type="radio"
                        value="annul"
                      />
                      <span className="player-choice-name">Anular</span>
                      <span className="player-choice-status">Votos · {liveVoteCounts.annul ?? 0}</span>
                    </label>
                  </div>
                </fieldset>
                <button className="primary-button" disabled={!voteChoice} type="submit">Registrar voto</button>
              </form>
            </>
          ) : (
            <p>Confira a quantidade de votos registrados e confirme a apuração.</p>
          )}
          <p className="field-hint">{match.voting.votes.length} voto(s) registrado(s); ordem e escolhas são privadas do mestre.</p>
        </section>
      )}

      {match.phase === "ready-for-night" && (
        <section className="phase-panel">
          <h3>Resultado da votação</h3>
          <VoteOutcome match={match} />
          <p className="public-script">
            <strong>Para anunciar:</strong>{" "}
            {latestVote?.type === "vote-resolved" && latestVote.outcome === "exiled"
              ? `${playerName(match, latestVote.exiledPlayerId!)} saiu da partida. Não revele o papel.`
              : "a votação foi anulada; ninguém saiu da partida."}
          </p>
          <PlayerRoster match={match} />
          <button className="primary-button" onClick={() => transition((current) => startNextNight(current))} type="button">
            Iniciar noite {match.round + 1}
          </button>
        </section>
      )}

      {match.phase === "finished" && (
        <section className="phase-panel">
          <h3>Partida encerrada</h3>
          <p className="public-script">
            <strong>Para anunciar:</strong> vitória dos {match.winner === "werewolves" ? "Lobisomens" : "Aldeões"}.
          </p>
          {latestNight && <p>Eliminados nesta noite: {latestNight.eliminatedPlayerIds.map((id) => playerName(match, id)).join(", ") || "ninguém"}.</p>}
          <PlayerRoster match={match} />
          {editingReplay ? (
            <GameEditor
              game={initialGame}
              match={match}
              onCancel={() => setEditingReplay(false)}
              onSave={(game, roleCounts) => handleReplay(game, roleCounts ?? getRoleCounts(match.players))}
              restartOnSave
              submitLabel="Salvar e sortear novamente"
            />
          ) : (
            <div className="button-row">
              <button
                className="primary-button"
                onClick={() => handleReplay(initialGame, getRoleCounts(match.players))}
                type="button"
              >
                Jogar novamente
              </button>
              <button className="secondary-button" onClick={() => setEditingReplay(true)} type="button">
                Jogar novamente e editar participantes
              </button>
            </div>
          )}
        </section>
      )}

      <section className="phase-panel history-panel">
        <h3>Histórico privado</h3>
        {match.history.length === 0 ? (
          <p className="field-hint">Os resultados confirmados aparecerão aqui.</p>
        ) : (
          <ol className="history-list">
            {match.history.map((entry, index) => (
              <li key={`${entry.type}-${entry.round}-${index}`}>
                <strong>{entry.type === "night-resolved" ? `Noite ${entry.round}` : `Votação ${entry.round}`}</strong>
                {entry.type === "night-resolved" ? (
                  <>
                    <span>Ações: {entry.actions.map(({ role, action }) => `${ROLE_LABELS[role]} — ${formatNightAction(match, action)}`).join("; ") || "nenhuma"}.</span>
                    <span>Eliminados: {entry.eliminatedPlayerIds.map((id) => playerName(match, id)).join(", ") || "ninguém"}.</span>
                    {(entry.pendingCursedConversionPlayerIds?.length ?? 0) > 0 && (
                      <span>Conversão pendente, manter em segredo: {(entry.pendingCursedConversionPlayerIds ?? []).map((id) => playerName(match, id)).join(", ")}.</span>
                    )}
                    {(entry.convertedPlayerIds?.length ?? 0) > 0 && (
                      <span>Conversão efetiva nesta noite: {(entry.convertedPlayerIds ?? []).map((id) => playerName(match, id)).join(", ")}.</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>Resultado: {entry.outcome === "exiled" ? `exílio de ${playerName(match, entry.exiledPlayerId!)}` : "anulada"}.</span>
                    <span>Votos para anular: {entry.annulVotes}.</span>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
      </fieldset>
    </section>
  );
}

function PlayerRoster({ match }: { match: MatchState }) {
  return (
    <div className="roster-section">
      <p className="detail-label">PARTICIPANTES E PAPÉIS · PRIVADO DO MESTRE</p>
      <ul className="roster-list">
        {match.players.map((player) => (
          <li key={player.id}>
            <span>{player.name}</span>
            <strong>{ROLE_LABELS[player.role]}</strong>
            <span className={`player-status ${player.status}`}>
              {player.status === "alive" ? "Vivo" : player.status === "dead" ? "Morto" : "Exilado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoteOutcome({ match }: { match: MatchState }) {
  const entry = [...match.history].reverse().find((item) => item.type === "vote-resolved");
  if (!entry || entry.type !== "vote-resolved") return null;

  const labels: Record<typeof entry.outcome, string> = {
    "annulled-majority": "Anulada por maioria de votos para anular",
    "annulled-tie": "Anulada por empate no maior número de votos",
    "annulled-plurality": "Anulada: “anular” recebeu mais votos, sem maioria",
    exiled: `Exílio de ${playerName(match, entry.exiledPlayerId!)}`,
  };
  return (
    <div>
      <p><strong>{labels[entry.outcome]}</strong></p>
      <p>Votos para anular: {entry.annulVotes}.</p>
      <ul className="private-list">
        {Object.entries(entry.counts).map(([id, count]) => (
          <li key={id}><span>{playerName(match, id)}</span><strong>{count}</strong></li>
        ))}
      </ul>
    </div>
  );
}

function GameEditor({
  game,
  match,
  onSave,
  onCancel,
  restartOnSave = false,
  submitLabel = "Salvar alterações",
}: {
  game: Game;
  match?: MatchState;
  onSave: (
    updatedGame: Game,
    roleCounts?: Record<RoleId, number>,
    restart?: boolean,
  ) => Promise<void>;
  onCancel: () => void;
  restartOnSave?: boolean;
  submitLabel?: string;
}) {
  const [name, setName] = useState(game.name);
  const [players, setPlayers] = useState(game.players.map((player) => ({ ...player })));
  const [roleCounts, setRoleCounts] = useState(
    match ? getRoleCounts(match.players) : INITIAL_ROLE_COUNTS,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updatePlayerName(index: number, value: string) {
    setPlayers((current) =>
      current.map((player, currentIndex) =>
        currentIndex === index ? { ...player, name: value } : player,
      ),
    );
  }

  function removePlayer(id: string) {
    setPlayers((current) => current.filter((player) => player.id !== id));
    if (match) {
      setRoleCounts((current) => ({
        ...current,
        villager: Math.max(0, current.villager - 1),
      }));
    }
  }

  function addPlayer() {
    setPlayers((current) => [...current, { id: crypto.randomUUID(), name: "" }]);
    if (match) {
      setRoleCounts((current) => ({ ...current, villager: current.villager + 1 }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const rosterChanged = players.length !== game.players.length ||
        players.some((player) => !game.players.some((savedPlayer) => savedPlayer.id === player.id));
      const currentRoleCounts = match ? getRoleCounts(match.players) : null;
      const roleCountsChanged = !!currentRoleCounts && ROLE_IDS.some(
        (role) => roleCounts[role] !== currentRoleCounts[role],
      );
      const restart = !!match && (restartOnSave || rosterChanged || roleCountsChanged);
      if (restart && !window.confirm(
        "Esta ação iniciará uma nova partida com novo sorteio. O progresso atual será substituído. Continuar?",
      )) return;

      const updatedGame = createGame({
        id: game.id,
        name,
        players,
        createdAt: game.createdAt,
      });

      setSaving(true);
      await onSave(
        { ...updatedGame, updatedAt: new Date().toISOString() },
        match ? roleCounts : undefined,
        restart,
      );
    } catch (saveError: unknown) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="game-editor" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="edit-game-name">Nome da partida</label>
      <input
        id="edit-game-name"
        maxLength={60}
        onChange={(event) => setName(event.target.value)}
        required
        value={name}
      />
      <div className="players-heading">
        <span className="field-label">Participantes</span>
        <span className="field-hint">{players.length} de 75</span>
      </div>
      <div className="player-fields">
        {players.map((player, index) => (
          <div className="player-field" key={player.id}>
            <span className="player-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <input
              aria-label={`Nome do participante editado ${index + 1}`}
              maxLength={40}
              onChange={(event) => updatePlayerName(index, event.target.value)}
              required
              value={player.name}
            />
            {players.length > 1 && (
              <button
                aria-label={`Remover participante editado ${index + 1}`}
                className="remove-player"
                onClick={() => removePlayer(player.id)}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        className="add-player"
        disabled={players.length >= 75}
        onClick={addPlayer}
        type="button"
      >
        <span aria-hidden="true">+</span> Adicionar participante
      </button>
      {match && (
        <div className="setup-options">
          <p className="detail-label">CARTAS POR FUNÇÃO</p>
          <p className="field-hint">
            Ajuste as quantidades para corresponder aos {players.length} participantes.
          </p>
          <RoleCountGroups
            onChange={(role, value) => setRoleCounts((counts) => ({ ...counts, [role]: value }))}
            roleCounts={roleCounts}
          />
          <p className="field-hint">
            Total: {Object.values(roleCounts).reduce((total, count) => total + count, 0)} cartas.
          </p>
        </div>
      )}
      {error && <p className="message error-message" role="alert">{error}</p>}
      <div className="button-row">
        <button className="primary-button" disabled={saving} type="submit">
          {saving ? "Salvando..." : submitLabel}
        </button>
        <button className="secondary-button" disabled={saving} onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchState | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchLoadError, setMatchLoadError] = useState("");
  const [matchLoadAttempt, setMatchLoadAttempt] = useState(0);
  const [gameName, setGameName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", "", ""]);
  const [roleCounts, setRoleCounts] = useState<Record<RoleId, number>>(INITIAL_ROLE_COUNTS);
  const [dayDurationMinutes, setDayDurationMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [backupNotice, setBackupNotice] = useState("");

  useEffect(() => {
    let active = true;

    listGames()
      .then((savedGames) => {
        if (active) setGames(savedGames);
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setSelectedMatch(null);
    setMatchLoadError("");
    if (!selectedGame || activeMatch) {
      setLoadingMatch(false);
      return () => { active = false; };
    }
    setLoadingMatch(true);
    getMatch(selectedGame.id)
      .then((savedMatch) => {
        if (active) setSelectedMatch(savedMatch ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) setMatchLoadError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoadingMatch(false);
      });
    return () => { active = false; };
  }, [selectedGame, activeMatch, matchLoadAttempt]);

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const players: PlayerInput[] = playerNames
        .filter((playerName) => playerName.trim())
        .map((playerName) => ({ id: crypto.randomUUID(), name: playerName }));
      const game = createGame({
        id: crypto.randomUUID(),
        name: gameName,
        players,
        createdAt: new Date().toISOString(),
      });
      const match = makeMatch(game, roleCounts, dayDurationMinutes);

      setSaving(true);
      await saveGameAndMatch(game, match);
      setGames((currentGames) => [game, ...currentGames]);
      setSelectedGame(game);
      setActiveMatch(match);
      setGameName("");
      setPlayerNames(["", "", "", "", ""]);
      setRoleCounts(INITIAL_ROLE_COUNTS);
      setDayDurationMinutes(5);
      setNotice("");
    } catch (saveError: unknown) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    );
  }

  function addPlayerField() {
    setPlayerNames((currentNames) => currentNames.length < 75 ? [...currentNames, ""] : currentNames);
  }

  function removePlayerField(index: number) {
    setPlayerNames((currentNames) =>
      currentNames.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function prepareSelectedGame() {
    if (!selectedGame) return;
    setError("");
    setNotice("");
    try {
      const match = makeMatch(selectedGame, roleCounts, dayDurationMinutes);
      setSaving(true);
      await saveMatch(match);
      setSelectedMatch(match);
      setActiveMatch(match);
    } catch (prepareError: unknown) {
      setError(errorMessage(prepareError));
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedGame(
    updatedGame: Game,
    roleCounts?: Record<RoleId, number>,
    restart = false,
  ) {
    const savedMatch = selectedMatch?.id === updatedGame.id ? selectedMatch : undefined;
    let updatedMatch: MatchState | undefined;
    if (savedMatch && restart) {
      if (!roleCounts) throw new Error("A composição das cartas não foi informada.");
      updatedMatch = makeMatch(updatedGame, roleCounts, savedMatch.dayDurationMinutes);
      await saveGameAndMatch(updatedGame, updatedMatch);
    } else if (savedMatch) {
      const editedPlayers = new Map(updatedGame.players.map((player) => [player.id, player]));
      if (savedMatch.players.length !== updatedGame.players.length ||
          savedMatch.players.some((player) => !editedPlayers.has(player.id))) {
        throw new Error("A lista de participantes mudou sem reiniciar o progresso.");
      }
      updatedMatch = {
        ...savedMatch,
        name: updatedGame.name,
        players: savedMatch.players.map((player) => {
          const editedPlayer = editedPlayers.get(player.id);
          if (!editedPlayer) {
            throw new Error("Um participante da partida não está presente no cadastro atualizado.");
          }
          return { ...player, name: editedPlayer.name };
        }),
      };
      await saveGameAndMatch(updatedGame, updatedMatch);
    } else {
      await saveGame(updatedGame);
    }

    setGames((currentGames) =>
      currentGames
        .map((game) => game.id === updatedGame.id ? updatedGame : game)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    );
    setSelectedGame(updatedGame);
    setSelectedMatch(updatedMatch ?? null);
    setEditingGameId(null);
  }

  async function saveReplay(game: Game, roleCounts: Record<RoleId, number>) {
    const duration = activeMatch?.dayDurationMinutes ?? 5;
    const match = makeMatch(game, roleCounts, duration);
    await saveGameAndMatch(game, match);
    setGames((currentGames) =>
      [
        game,
        ...currentGames.filter((savedGame) => savedGame.id !== game.id),
      ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    );
    setSelectedGame(game);
    setSelectedMatch(match);
    setEditingGameId(null);
    setActiveMatch(match);
  }

  async function savePreparedEdit(
    game: Game,
    roleCounts: Record<RoleId, number>,
    restart: boolean,
    currentMatch: MatchState,
  ): Promise<MatchState> {
    const updatedMatch = restart
      ? makeMatch(game, roleCounts, currentMatch.dayDurationMinutes)
      : {
          ...currentMatch,
          name: game.name,
          players: currentMatch.players.map((player) => {
            const editedPlayer = game.players.find(({ id }) => id === player.id);
            if (!editedPlayer) {
              throw new Error("Um participante da partida não está presente no cadastro atualizado.");
            }
            return { ...player, name: editedPlayer.name };
          }),
        };
    await saveGameAndMatch(game, updatedMatch);
    setGames((currentGames) =>
      currentGames
        .map((savedGame) => savedGame.id === game.id ? game : savedGame)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    );
    setSelectedGame(game);
    setSelectedMatch(updatedMatch);
    return updatedMatch;
  }

  async function removeSelectedGame() {
    if (!selectedGame) return;
    if (!window.confirm(`Excluir a partida "${selectedGame.name}" e seu cadastro deste dispositivo?`)) {
      return;
    }

    setError("");
    setSaving(true);
    try {
      await deleteGame(selectedGame.id);
      setGames((currentGames) => currentGames.filter((game) => game.id !== selectedGame.id));
      setSelectedGame(null);
      setEditingGameId(null);
    } catch (deleteError: unknown) {
      setError(errorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportBackup() {
    setBackupError("");
    setBackupNotice("");
    setBackupBusy(true);
    try {
      const backup = await createBackup();
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `werewolf-god-backup-${new Date().toISOString().slice(0, 10)}.json`;
      try {
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      setBackupNotice(`Backup de ${backup.games.length} partida(s) exportado. Guarde o arquivo em local seguro.`);
    } catch (exportError: unknown) {
      setBackupError(errorMessage(exportError));
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setBackupError("");
    setBackupNotice("");
    setBackupBusy(true);
    try {
      let contents: unknown;
      const text = await file.text();
      try {
        contents = JSON.parse(text);
      } catch {
        throw new Error("O arquivo selecionado não contém JSON válido.");
      }
      const backup = parseBackup(contents);
      if (!window.confirm(
        `Importar ${backup.games.length} partida(s)? Partidas com o mesmo identificador serão substituídas; as demais partidas locais serão mantidas.`,
      )) {
        return;
      }

      const importedCount = await importBackup(backup);
      const updatedGames = await listGames();
      setGames(updatedGames);
      setSelectedGame(null);
      setSelectedMatch(null);
      setEditingGameId(null);
      setBackupNotice(`${importedCount} partida(s) importada(s). Os cadastros correspondentes foram atualizados.`);
    } catch (importError: unknown) {
      setBackupError(errorMessage(importError));
    } finally {
      setBackupBusy(false);
    }
  }

  if (activeMatch) {
    const initialGame = selectedGame?.id === activeMatch.id
      ? selectedGame
      : games.find((game) => game.id === activeMatch.id) ?? {
          id: activeMatch.id,
          name: activeMatch.name,
          players: activeMatch.players.map(({ id, name }) => ({ id, name })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
    return (
      <div className="app-shell">
        <header className="topbar">
          <a
            className="brand"
            href="/"
            aria-label="Werewolf Moderator, início"
            onClick={(event) => {
              event.preventDefault();
              setActiveMatch(null);
            }}
          >
            <span className="brand-mark" aria-hidden="true">W</span>
            <span className="brand-copy">
              <strong>WEREWOLF MODERATOR</strong>
              <span>ASSISTENTE DO MESTRE</span>
              <span className="release-version">{RELEASE_LABEL}</span>
            </span>
          </a>
          <span className="status-pill"><span /> TELA PRIVADA</span>
        </header>
        <main>
          <MasterConsole
            key={`${activeMatch.id}-${activeMatch.phase}-${activeMatch.history.length}`}
            initialGame={initialGame}
            initialMatch={activeMatch}
            onEditPrepared={savePreparedEdit}
            onExit={() => setActiveMatch(null)}
            onReplay={saveReplay}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Werewolf Moderator, início">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span className="brand-copy">
            <strong>WEREWOLF MODERATOR</strong>
            <span>ASSISTENTE DO MESTRE</span>
            <span className="release-version">{RELEASE_LABEL}</span>
          </span>
        </a>
        <div className="topbar-actions">
          <a className="catalog-link" href="#personagens">Personagens</a>
          <span className="status-pill"><span /> VERSÃO ATUAL</span>
        </div>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">A NOITE COMEÇA COM UMA BOA PREPARAÇÃO</p>
          <h1 id="page-title">Sua mesa,<br /><em>sob seu comando.</em></h1>
          <p className="intro-copy">
            Prepare a composição, sorteie os papéis e conduza cada fase. As informações
            secretas são apresentadas somente na tela privada do mestre.
          </p>
        </section>

        <div className="workspace">
          <section className="panel create-panel" aria-labelledby="create-title">
            <div className="panel-heading">
              <span className="step-number">01</span>
              <div>
                <p className="eyebrow">PREPARAÇÃO</p>
                <h2 id="create-title">Nova partida</h2>
              </div>
            </div>

            <form onSubmit={handleCreateGame}>
              <label className="field-label" htmlFor="game-name">Nome da partida</label>
              <input
                autoComplete="off"
                id="game-name"
                maxLength={60}
                onChange={(event) => setGameName(event.target.value)}
                placeholder="Ex.: Noite na Vila"
                required
                value={gameName}
              />

              <div className="players-heading">
                <span className="field-label">Participantes ({playerNames.filter((name) => name.trim()).length})</span>
                <span className="field-hint">De 5 a 75 jogadores</span>
              </div>

              <div className="player-fields">
                {playerNames.map((playerName, index) => (
                  <div className="player-field" key={index}>
                    <span className="player-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <input
                      aria-label={`Nome do participante ${index + 1}`}
                      autoComplete="off"
                      maxLength={40}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                      placeholder={`Participante ${index + 1}`}
                      value={playerName}
                    />
                    {playerNames.length > 1 && (
                      <button
                        aria-label={`Remover participante ${index + 1}`}
                        className="remove-player"
                        onClick={() => removePlayerField(index)}
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button className="add-player" disabled={playerNames.length >= 75} onClick={addPlayerField} type="button">
                <span aria-hidden="true">+</span> Adicionar participante
              </button>

              <div className="setup-options">
                <p className="detail-label">CARTAS POR FUNÇÃO</p>
                <p className="field-hint">A soma deve corresponder aos participantes nomeados.</p>
                <RoleCountGroups
                  onChange={(role, value) =>
                    setRoleCounts((counts) => ({ ...counts, [role]: value }))
                  }
                  roleCounts={roleCounts}
                />
                <label className="field-label duration-field" htmlFor="day-duration">
                  Duração da discussão (minutos)
                  <select
                    id="day-duration"
                    onChange={(event) => setDayDurationMinutes(Number(event.target.value))}
                    value={dayDurationMinutes}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} minuto(s)</option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <p className="message error-message" role="alert">{error}</p>}
              {notice && <p className="message success-message" role="status">{notice}</p>}

              <button className="primary-button" disabled={saving || loading} type="submit">
                {saving ? "Salvando..." : "Sortear papéis e preparar"}
                <span aria-hidden="true">↗</span>
              </button>
              <p className="local-note">
                <span aria-hidden="true">◈</span> Cadastro salvo neste dispositivo
              </p>
            </form>
          </section>

          <section className="panel games-panel" aria-labelledby="games-title">
            <div className="panel-heading">
              <span className="step-number">02</span>
              <div>
                <p className="eyebrow">CONTINUE DE ONDE PAROU</p>
                <h2 id="games-title">Suas partidas</h2>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">Carregando partidas salvas...</p>
            ) : games.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">☾</span>
                <p>Nenhuma partida por aqui.</p>
                <span>Crie uma nova para começar a preparar sua mesa.</span>
              </div>
            ) : (
              <ul className="game-list">
                {games.map((game) => (
                  <li key={game.id}>
                    <button
                      aria-pressed={selectedGame?.id === game.id}
                      className={`game-card${selectedGame?.id === game.id ? " selected" : ""}`}
                      onClick={() => setSelectedGame(game)}
                      type="button"
                    >
                      <span className="game-card-icon" aria-hidden="true">☾</span>
                      <span className="game-card-copy">
                        <strong>{game.name}</strong>
                        <span>{game.players.length} participantes</span>
                      </span>
                      <span className="game-card-arrow" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedGame && (
              <div className="game-detail">
                {editingGameId === selectedGame.id ? (
                  <GameEditor
                    game={selectedGame}
                    onCancel={() => setEditingGameId(null)}
                    onSave={saveEditedGame}
                    match={selectedMatch ?? undefined}
                  />
                ) : (
                  <>
                    <p className="detail-label">PARTICIPANTES</p>
                    <ul>
                      {selectedGame.players.map((player) => (
                        <li key={player.id}>{player.name}</li>
                      ))}
                    </ul>
                    {error && <p className="message error-message" role="alert">{error}</p>}
                    {matchLoadError && <p className="message error-message" role="alert">Não foi possível carregar o progresso: {matchLoadError}</p>}
                    {matchLoadError && <button className="secondary-button" onClick={() => setMatchLoadAttempt((attempt) => attempt + 1)} type="button">Tentar carregar novamente</button>}
                    {loadingMatch && <p className="field-hint" role="status">Carregando progresso...</p>}
                    <div className="game-management-actions">
                      {selectedMatch ? (
                        <button className="primary-button" disabled={saving || loadingMatch} onClick={() => setActiveMatch(selectedMatch)} type="button">
                          Retomar partida
                        </button>
                      ) : (
                        <button className="primary-button" disabled={saving || loadingMatch || !!matchLoadError} onClick={prepareSelectedGame} type="button">
                          Sortear papéis e preparar esta partida
                        </button>
                      )}
                      <button className="secondary-button" disabled={saving || loadingMatch || !!matchLoadError} onClick={() => setEditingGameId(selectedGame.id)} type="button">
                        Editar cadastro
                      </button>
                      <button className="danger-button" disabled={saving} onClick={removeSelectedGame} type="button">
                        {saving ? "Aguarde..." : "Excluir partida"}
                      </button>
                    </div>
                    <p className="detail-note">
                      {selectedMatch
                        ? "Editar somente nomes preserva o progresso. Incluir ou remover participantes substitui o progresso por uma nova partida e sorteio."
                        : "A configuração de cartas e duração acima será usada. O sorteio e a condução ficam nesta tela privada do mestre."}
                    </p>
                  </>
                )}
              </div>
            )}

            <section className="backup-controls" aria-labelledby="backup-title">
              <h3 id="backup-title">Backup e uso offline</h3>
              <p>
                O backup inclui cadastros, papéis, ações e histórico secretos. Mantenha o arquivo privado.
                Depois da primeira visita online, o aplicativo pode ser aberto sem conexão.
              </p>
              <div className="button-row">
                <button
                  className="secondary-button"
                  disabled={backupBusy || loading}
                  onClick={handleExportBackup}
                  type="button"
                >
                  {backupBusy ? "Aguarde..." : "Exportar backup"}
                </button>
                <label className={`secondary-button backup-import${backupBusy || loading ? " disabled" : ""}`}>
                  Importar backup
                  <input
                    accept="application/json,.json"
                    aria-label="Importar backup"
                    disabled={backupBusy || loading}
                    onChange={handleImportBackup}
                    type="file"
                  />
                </label>
              </div>
              {backupError && <p className="message error-message" role="alert">{backupError}</p>}
              {backupNotice && <p className="message success-message" role="status">{backupNotice}</p>}
            </section>
          </section>
        </div>

        <section className="catalog-section" id="personagens" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <p className="eyebrow">GUIA RÁPIDO</p>
            <h2 id="catalog-title">Personagens da vila</h2>
            <p>
              Veja em poucas palavras o papel de cada personagem. As ilustrações
              são originais e não alteram as regras aprovadas do jogo.
            </p>
          </div>
          <div className="role-catalog">
            {ROLE_IDS.map((role) => (
              <article className={`role-card role-card-${role}`} key={role}>
                <div className="role-card-art">
                  <RoleIllustration role={role} />
                </div>
                <div className="role-card-copy">
                  <p className="role-card-faction">{ROLE_FACTIONS[role]}</p>
                  <h3>{ROLE_LABELS[role]}</h3>
                  <p className="role-card-summary">{ROLE_SUMMARIES[role]}</p>
                  {ROLE_MORE_INFO[role] && (
                    <details
                      aria-label={`Mais informações sobre ${ROLE_LABELS[role]}`}
                      className="role-card-details"
                    >
                      <summary>Ler mais</summary>
                      <ul>
                        {ROLE_MORE_INFO[role]?.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="page-footer">
          <span>FEITO PARA QUEM CONDUZ A HISTÓRIA</span>
          <span>AS REGRAS SÃO SUAS</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
