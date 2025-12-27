import type { Participant } from './types';

const STORAGE_KEY = 'darts-participants';

export const saveParticipants = (participants: Participant[]): void => {
  try {
    const existing = loadParticipants();
    const combined = [...existing];
    
    participants.forEach(p => {
      if (!combined.find(ep => ep.id === p.id || ep.name === p.name)) {
        combined.push(p);
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
  } catch (error) {
    console.error('Error saving participants:', error);
  }
};

export const loadParticipants = (): Participant[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading participants:', error);
    return [];
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

// Calculate next power of 2
export const nextPowerOf2 = (n: number): number => {
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

// Check if number is power of 2
export const isPowerOf2 = (n: number): boolean => {
  return n > 0 && (n & (n - 1)) === 0;
};

// Calculate number of byes needed
export const calculateByes = (participantCount: number): number => {
  if (isPowerOf2(participantCount)) return 0;
  return nextPowerOf2(participantCount) - participantCount;
};

// Shuffle array (Fisher-Yates)
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
