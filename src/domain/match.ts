import type { NightRole, RoleId } from "./ruleset-v1";

export type PlayerStatus = "alive" | "dead" | "exiled";
export type MatchPhase =
  | "prepared"
  | "night"
  | "seer-result"
  | "night-resolution"
  | "dawn"
  | "discussion"
  | "voting"
  | "ready-for-night"
  | "finished";
export type WinningTeam = "werewolves" | "villagers";

export interface MatchPlayer {
  id: string;
  name: string;
  role: RoleId;
  status: PlayerStatus;
  eliminatedAtRound?: number;
  eliminationCause?: "night" | "vote";
}

export interface WerewolfAction {
  kind: "werewolf-attack";
  targetId: string;
}

export interface BodyguardAction {
  kind: "bodyguard-protect";
  targetId: string;
}

export interface WitchAction {
  kind: "witch";
  protectTargetId?: string;
  eliminateTargetId?: string;
}

export interface SeerAction {
  kind: "seer-investigate";
  targetId: string;
}

export interface SpellcasterAction {
  kind: "spellcaster-silence";
  targetId: string;
}

export type NightAction =
  | WerewolfAction
  | BodyguardAction
  | WitchAction
  | SeerAction
  | SpellcasterAction;

export interface NightActionRecord {
  role: NightRole;
  action: NightAction;
}

export interface NightState {
  schedule: NightRole[];
  nextCallIndex: number;
  actions: NightActionRecord[];
}

export interface WitchResources {
  protectionUsed: boolean;
  eliminationUsed: boolean;
}

export interface DiscussionTimer {
  status: "running" | "paused" | "ended" | "expired";
  remainingMs: number;
  startedAtMs: number | null;
}

export interface VoteForPlayer {
  kind: "player";
  playerId: string;
}

export interface VoteToAnnul {
  kind: "annul";
}

export type VoteChoice = VoteForPlayer | VoteToAnnul;

export interface VoteRecord {
  voterId: string;
  choice: VoteChoice;
}

export interface VotingState {
  order: string[];
  nextVoterIndex: number;
  votes: VoteRecord[];
}

export interface InvestigationResult {
  targetId: string;
  isWerewolf: boolean;
}

export interface NightHistoryEntry {
  type: "night-resolved";
  round: number;
  actions: NightActionRecord[];
  eliminatedPlayerIds: string[];
  protectedPlayerIds: string[];
  blockedAttackTargetIds: string[];
  investigations: InvestigationResult[];
}

export interface VoteHistoryEntry {
  type: "vote-resolved";
  round: number;
  outcome: "annulled-majority" | "annulled-tie" | "annulled-plurality" | "exiled";
  annulVotes: number;
  counts: Record<string, number>;
  exiledPlayerId?: string;
}

export type MatchHistoryEntry = NightHistoryEntry | VoteHistoryEntry;

export interface MatchState {
  id: string;
  name: string;
  rulesetId: string;
  players: MatchPlayer[];
  dayDurationMinutes: number;
  phase: MatchPhase;
  round: number;
  night?: NightState;
  discussion?: DiscussionTimer;
  voting?: VotingState;
  witchResources: WitchResources;
  lastBodyguardTargetId?: string;
  lastSpellcasterTargetId?: string;
  history: MatchHistoryEntry[];
  winner?: WinningTeam;
}

export interface NightResolution {
  match: MatchState;
  eliminatedPlayerIds: string[];
  protectedPlayerIds: string[];
  blockedAttackTargetIds: string[];
  investigations: InvestigationResult[];
  publicAnnouncement:
    | { kind: "deaths"; eliminatedPlayerIds: string[] }
    | { kind: "no-deaths" };
  winner?: WinningTeam;
}

export interface VoteResolution {
  match: MatchState;
  outcome: "annulled-majority" | "annulled-tie" | "annulled-plurality" | "exiled";
  counts: Record<string, number>;
  annulVotes: number;
  exiledPlayerId?: string;
  winner?: WinningTeam;
}
