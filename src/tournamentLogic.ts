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
    const n = participants.length;
    
    // Use round-robin algorithm for better match distribution
    // This ensures players alternate and don't play twice in a row
    for (let round = 0; round < matchesPerOpponent; round++) {
      const isSwapped = round % 2 === 1; // For home/away in second round
      
      // Round-robin algorithm: for n players, we need (n-1) or n rounds depending on even/odd
      const numRounds = n % 2 === 0 ? n - 1 : n;
      
      for (let roundNum = 0; roundNum < numRounds; roundNum++) {
        // Create a rotation schedule
        const roundParticipants = [...participants];
        
        // Rotate all except first player (if even number of players)
        if (n % 2 === 0) {
          for (let r = 0; r < roundNum; r++) {
            const temp = roundParticipants[roundParticipants.length - 1];
            for (let i = roundParticipants.length - 1; i > 1; i--) {
              roundParticipants[i] = roundParticipants[i - 1];
            }
            roundParticipants[1] = temp;
          }
          
          // Create matches for this round
          for (let i = 0; i < n / 2; i++) {
            const player1 = roundParticipants[i];
            const player2 = roundParticipants[n - 1 - i];
            
            matches.push({
              id: generateId(),
              player1: isSwapped ? player2 : player1,
              player2: isSwapped ? player1 : player2,
              winner: null,
              groupId: group.id
            });
          }
        } else {
          // For odd number of players, one sits out each round
          const rotated = [...roundParticipants];
          for (let r = 0; r < roundNum; r++) {
            rotated.push(rotated.shift()!);
          }
          
          // Create matches (last player sits out)
          for (let i = 0; i < Math.floor(n / 2); i++) {
            const player1 = rotated[i];
            const player2 = rotated[n - 2 - i];
            
            matches.push({
              id: generateId(),
              player1: isSwapped ? player2 : player1,
              player2: isSwapped ? player1 : player2,
              winner: null,
              groupId: group.id
            });
          }
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
    
    // Standard bracket advancement:
    // R1 match i advances to R2 match floor(i/2)
    // - Even i (0, 2, 4...) → player1 of target match
    // - Odd i (1, 3, 5...) → player2 of target match
    
    // Mark which R2 slots will be filled by R1 winners
    const filledSlots = new Set<string>();
    for (let r1MatchIdx = 0; r1MatchIdx < firstRoundMatches; r1MatchIdx++) {
      const r2MatchIdx = Math.floor(r1MatchIdx / 2);
      const isPlayer1 = r1MatchIdx % 2 === 0;
      filledSlots.add(`${r2MatchIdx}-${isPlayer1 ? 'p1' : 'p2'}`);
    }
    
    // Place byes in empty slots
    let byeIndex = 0;
    for (let matchIdx = 0; matchIdx < round2Matches.length && byeIndex < byeParticipants.length; matchIdx++) {
      // Try player1 slot first
      if (!filledSlots.has(`${matchIdx}-p1`)) {
        round2Matches[matchIdx].player1 = byeParticipants[byeIndex++];
      }
      
      // Then try player2 slot if we still have byes to place
      if (byeIndex < byeParticipants.length && !filledSlots.has(`${matchIdx}-p2`)) {
        round2Matches[matchIdx].player2 = byeParticipants[byeIndex++];
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
