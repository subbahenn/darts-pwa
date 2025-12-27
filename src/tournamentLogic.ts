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
  
  // Calculate the number of rounds needed based on next power of 2
  const totalSlots = nextPowerOf2(participants.length);
  const numRounds = Math.log2(totalSlots);
  const byeCount = totalSlots - participants.length;
  
  // Track participants with byes (they auto-advance to round 2)
  const byeParticipants: string[] = [];
  
  // First round: Create matches for participants without byes
  // Number of matches in first round = (total participants - byes) / 2
  const firstRoundMatches = (participants.length - byeCount) / 2;
  const round1Matches: Match[] = [];
  
  let participantIndex = 0;
  
  // Create first round matches
  for (let i = 0; i < firstRoundMatches; i++) {
    round1Matches.push({
      id: generateId(),
      player1: shuffled[participantIndex++].id,
      player2: shuffled[participantIndex++].id,
      winner: null,
      round: 0
    });
  }
  
  // Remaining participants get byes
  while (participantIndex < shuffled.length) {
    byeParticipants.push(shuffled[participantIndex++].id);
  }
  
  rounds.push(round1Matches);
  
  // Create subsequent rounds with TBD placeholders
  for (let roundIndex = 1; roundIndex < numRounds; roundIndex++) {
    const matchesInRound = totalSlots / Math.pow(2, roundIndex + 1);
    const roundMatches: Match[] = [];
    
    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        id: generateId(),
        player1: null,
        player2: null,
        winner: null,
        round: roundIndex
      });
    }
    
    rounds.push(roundMatches);
  }
  
  // Place bye participants in round 2 (round index 1)
  // Byes should fill the slots that won't be filled by R1 winners
  if (byeParticipants.length > 0 && rounds.length > 1) {
    const round2Matches = rounds[1];
    
    // Calculate which slots in R2 will be filled by R1 winners
    // R1 has firstRoundMatches matches (0, 1, 2, ...)
    // Match i in R1 advances to match floor(i/2) in R2
    // If i is even, goes to player1; if odd, goes to player2
    
    // Total slots in R2 = round2Matches.length * 2
    // R1 winners will fill firstRoundMatches slots
    // Byes fill the remaining slots
    
    let byeIndex = 0;
    
    // We need to place byes in slots that won't conflict with R1 winners
    // Start from the end of R2 matches and work backwards
    for (let matchIdx = round2Matches.length - 1; matchIdx >= 0 && byeIndex < byeParticipants.length; matchIdx--) {
      // Check if this match's player2 slot will be filled by R1 winner
      const wouldBeFilledByR1 = (matchIdx * 2 + 1) < firstRoundMatches;
      
      if (!wouldBeFilledByR1) {
        round2Matches[matchIdx].player2 = byeParticipants[byeIndex++];
      }
      
      if (byeIndex >= byeParticipants.length) break;
      
      // Check if this match's player1 slot will be filled by R1 winner  
      const player1WouldBeFilledByR1 = (matchIdx * 2) < firstRoundMatches;
      
      if (!player1WouldBeFilledByR1) {
        round2Matches[matchIdx].player1 = byeParticipants[byeIndex++];
      }
    }
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
