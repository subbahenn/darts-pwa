export interface Participant {
  id: string;
  name: string;
}

export type TournamentMode = 'group' | 'knockout' | 'group-knockout';

export interface Match {
  id: string;
  player1: string | null; // participant id or null for bye
  player2: string | null;
  winner: string | null;
  score1?: number;
  score2?: number;
  round?: number; // for knockout
  groupId?: string; // for group stage
}

export interface Group {
  id: string;
  name: string;
  participants: string[]; // participant ids
}

export interface TournamentConfig {
  mode: TournamentMode;
  participantCount: number;
  participants: Participant[];
  groupCount?: number;
  matchesPerOpponent?: number; // for group stage
  bestOf?: number; // Best of x - first to win more than x/2 legs wins
}

export interface GroupStanding {
  participantId: string;
  participantName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Tournament {
  id: string;
  config: TournamentConfig;
  groups?: Group[];
  matches: Match[];
  knockoutBracket?: KnockoutBracket;
  started: boolean;
  completed: boolean;
  createdAt?: number; // Unix timestamp in milliseconds
}

export interface KnockoutBracket {
  rounds: Match[][];
  byeParticipants: string[]; // participants with byes in first round
}
