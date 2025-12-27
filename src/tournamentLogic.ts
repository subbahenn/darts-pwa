import type { 
  Group, 
  Match, 
  Participant, 
  KnockoutBracket,
  TournamentConfig,
  GroupStanding
} from './types';
import { generateId, shuffle, nextPowerOf2 } from './utils';

// Generate groups for group stage
export const generateGroups = (
  participants: Participant[],
  groupCount: number
): Group[] => {
  const groups: Group[] = [];
  const shuffled = shuffle(participants);
  
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      id: generateId(),
      name: String.fromCharCode(65 + i), // A, B, C, etc.
      participants: []
    });
  }
  
  // Distribute participants evenly
  shuffled.forEach((participant, index) => {
    groups[index % groupCount].participants.push(participant.id);
  });
  
  return groups;
};

// Generate group stage matches
export const generateGroupMatches = (
  groups: Group[],
  matchesPerOpponent: number = 1
): Match[] => {
  const matches: Match[] = [];
  
  groups.forEach(group => {
    const participants = group.participants;
    
    // Generate round-robin matches
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        for (let k = 0; k < matchesPerOpponent; k++) {
          matches.push({
            id: generateId(),
            player1: participants[i],
            player2: participants[j],
            winner: null,
            groupId: group.id
          });
        }
      }
    }
  });
  
  return matches;
};

// Generate knockout bracket with byes for non-power-of-2 participant counts
export const generateKnockoutBracket = (
  participants: Participant[]
): KnockoutBracket => {
  const shuffled = shuffle(participants);
  const rounds: Match[][] = [];
  
  // Calculate byes needed
  const totalSlots = nextPowerOf2(participants.length);
  const byeCount = totalSlots - participants.length;
  
  // Select random participants to get byes
  const byeParticipants: string[] = [];
  const playingInRound1: Participant[] = [];
  
  shuffled.forEach((p, index) => {
    if (index < byeCount) {
      byeParticipants.push(p.id);
    } else {
      playingInRound1.push(p);
    }
  });
  
  // Create first round matches (only for non-bye participants)
  const firstRoundMatches: Match[] = [];
  for (let i = 0; i < playingInRound1.length; i += 2) {
    firstRoundMatches.push({
      id: generateId(),
      player1: playingInRound1[i].id,
      player2: playingInRound1[i + 1]?.id || null,
      winner: null,
      round: 0
    });
  }
  
  rounds.push(firstRoundMatches);
  
  // Create second round with bye participants
  // Round 1 winners will fill in the remaining slots
  const round2Size = (byeCount + firstRoundMatches.length) / 2;
  const round2Matches: Match[] = [];
  
  // Distribute byes into round 2
  // If there are an odd number of byes, one gets a bye to round 3
  const byesInRound2 = Math.floor(byeCount / 2) * 2; // Pairs of byes
  const byesAutoAdvancing = byeCount - byesInRound2;
  
  for (let i = 0; i < round2Size; i++) {
    const match: Match = {
      id: generateId(),
      player1: null,
      player2: null,
      winner: null,
      round: 1
    };
    
    // Fill with bye participants first
    if (i < byesInRound2 / 2) {
      match.player1 = byeParticipants[i * 2];
      match.player2 = byeParticipants[i * 2 + 1];
    } else if (i === byesInRound2 / 2 && byesAutoAdvancing > 0) {
      // This match gets the auto-advancing bye
      match.player1 = byeParticipants[byesInRound2];
    }
    
    round2Matches.push(match);
  }
  
  rounds.push(round2Matches);
  
  // Create subsequent rounds
  let previousRoundSize = round2Size;
  let currentRound = 2;
  
  while (previousRoundSize > 1) {
    const nextRoundSize = previousRoundSize / 2;
    const roundMatches: Match[] = [];
    
    for (let i = 0; i < nextRoundSize; i++) {
      roundMatches.push({
        id: generateId(),
        player1: null,
        player2: null,
        winner: null,
        round: currentRound
      });
    }
    rounds.push(roundMatches);
    
    previousRoundSize = nextRoundSize;
    currentRound++;
  }
  
  return {
    rounds,
    byeParticipants
  };
};

// Suggest tournament configuration
export const suggestTournamentConfig = (
  participantCount: number,
  mode: TournamentConfig['mode']
): Partial<TournamentConfig> => {
  const suggestions: Partial<TournamentConfig> = {
    matchesPerOpponent: 1
  };
  
  if (mode === 'group' || mode === 'group-knockout') {
    // Suggest group count based on participant count
    // Following FIFA World Cup pattern
    if (participantCount <= 8) {
      suggestions.groupCount = 2;
    } else if (participantCount <= 16) {
      suggestions.groupCount = 4;
    } else if (participantCount <= 24) {
      suggestions.groupCount = 6;
    } else if (participantCount <= 32) {
      suggestions.groupCount = 8;
    } else {
      // Default to groups of ~4 participants
      suggestions.groupCount = Math.ceil(participantCount / 4);
    }
  }
  
  return suggestions;
};

// Get participants advancing from groups (top 2 by default)
export const getAdvancingParticipants = (
  groupStandings: Map<string, GroupStanding[]>,
  advancePerGroup: number = 2
): string[] => {
  const advancing: string[] = [];
  
  groupStandings.forEach(standings => {
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.played - a.played;
    });
    
    sorted.slice(0, advancePerGroup).forEach(standing => {
      advancing.push(standing.participantId);
    });
  });
  
  return advancing;
};
