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
  
  // ALL bye participants must be placed in Round 2 ONLY
  const byeParticipants: string[] = [];
  const playingInRound1: Participant[] = [];
  
  shuffled.forEach((p, index) => {
    if (index < byeCount) {
      byeParticipants.push(p.id);
    } else {
      playingInRound1.push(p);
    }
  });
  
  // Create Round 1 matches (non-bye participants)
  const round1Matches: Match[] = [];
  for (let i = 0; i < playingInRound1.length; i += 2) {
    round1Matches.push({
      id: generateId(),
      player1: playingInRound1[i].id,
      player2: playingInRound1[i + 1].id,
      winner: null,
      round: 0
    });
  }
  
  if (round1Matches.length > 0) {
    rounds.push(round1Matches);
  }
  
  // Round 2: ALL byes placed here, some may play each other
  // Example with 5 participants: 3 byes, 2 play R1
  // R2 should have: Bye1 vs Bye2, R1winner vs Bye3
  // Total R2 matches = totalSlots / 2
  const round2Size = totalSlots / 2;
  const round2Matches: Match[] = [];
  
  // Calculate how to distribute byes and R1 winners in R2
  const r1WinnerCount = round1Matches.length;
  
  // If we have more byes than R1 winners, pair byes together first
  // If we have odd number of byes, one bye waits for an R1 winner
  const byePairs = Math.floor(byeCount / 2);
  const singleBye = byeCount % 2;
  
  // Create bye vs bye matches
  for (let i = 0; i < byePairs; i++) {
    round2Matches.push({
      id: generateId(),
      player1: byeParticipants[i * 2],
      player2: byeParticipants[i * 2 + 1],
      winner: null,
      round: 1
    });
  }
  
  // If odd bye, create match with bye vs R1 winner
  if (singleBye === 1) {
    round2Matches.push({
      id: generateId(),
      player1: byeParticipants[byePairs * 2],
      player2: null, // R1 winner
      winner: null,
      round: 1
    });
  }
  
  // Create matches for remaining R1 winners (if any)
  const r1WinnersUsed = singleBye;
  const r1WinnersRemaining = r1WinnerCount - r1WinnersUsed;
  
  for (let i = 0; i < r1WinnersRemaining; i += 2) {
    round2Matches.push({
      id: generateId(),
      player1: null, // R1 winner
      player2: null, // R1 winner  
      winner: null,
      round: 1
    });
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
