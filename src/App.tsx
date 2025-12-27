import { useState } from 'react';
import TournamentSetup from './components/TournamentSetup';
import ParticipantSetup from './components/ParticipantSetup';
import TournamentConfig from './components/TournamentConfig';
import TournamentView from './components/TournamentView';
import type { Tournament, TournamentMode, Participant, TournamentConfig as TConfig } from './types';
import { generateId, saveParticipants } from './utils';
import { generateGroups, generateGroupMatches, generateKnockoutBracket } from './tournamentLogic';
import './App.css';

type SetupStep = 'initial' | 'participants' | 'config' | 'tournament';

function App() {
  const [step, setStep] = useState<SetupStep>('initial');
  const [mode, setMode] = useState<TournamentMode>('knockout');
  const [participantCount, setParticipantCount] = useState<number>(8);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const handleInitialSetup = (selectedMode: TournamentMode, count: number) => {
    setMode(selectedMode);
    setParticipantCount(count);
    setStep('participants');
  };

  const handleParticipantsComplete = (selectedParticipants: Participant[]) => {
    setParticipants(selectedParticipants);
    setStep('config');
  };

  const handleConfigComplete = (config: TConfig) => {
    // Save participants to localStorage
    saveParticipants(config.participants);

    // Generate tournament based on mode
    const newTournament: Tournament = {
      id: generateId(),
      config,
      matches: [],
      started: true,
      completed: false
    };

    if (config.mode === 'group' || config.mode === 'group-knockout') {
      // Generate groups
      const groups = generateGroups(config.participants, config.groupCount!);
      newTournament.groups = groups;
      
      // Generate group matches
      const groupMatches = generateGroupMatches(groups, config.matchesPerOpponent);
      newTournament.matches = groupMatches;
    }

    if (config.mode === 'knockout') {
      // Generate knockout bracket
      const bracket = generateKnockoutBracket(config.participants);
      newTournament.knockoutBracket = bracket;
      
      // Flatten all rounds to matches array
      const allMatches = bracket.rounds.flat();
      
      // Place bye participants into round 1 matches
      if (bracket.byeParticipants.length > 0 && bracket.rounds.length > 1) {
        const round1Matches = bracket.rounds[1];
        bracket.byeParticipants.forEach((byeParticipantId, index) => {
          if (index < round1Matches.length) {
            const match = allMatches.find(m => m.id === round1Matches[index].id);
            if (match) {
              match.player1 = byeParticipantId;
            }
          }
        });
      }
      
      newTournament.matches = allMatches;
    }

    if (config.mode === 'group-knockout') {
      // For now, just set up group stage
      // KO phase will be generated after group stage completion
      // This would need logic to determine advancing participants
    }

    setTournament(newTournament);
    setStep('tournament');
  };

  const handleUpdateMatch = (matchId: string, winner: string, score1?: number, score2?: number) => {
    if (!tournament) return;

    const updatedMatches = tournament.matches.map(match => {
      if (match.id === matchId) {
        return { ...match, winner, score1, score2 };
      }
      return match;
    });

    // If knockout, advance winner to next round and update bracket
    let updatedBracket = tournament.knockoutBracket;
    
    if (tournament.knockoutBracket) {
      const matchIndex = tournament.matches.findIndex(m => m.id === matchId);
      const match = tournament.matches[matchIndex];
      
      if (match.round !== undefined) {
        const nextRound = match.round + 1;
        if (nextRound < tournament.knockoutBracket.rounds.length) {
          const matchPositionInRound = tournament.knockoutBracket.rounds[match.round].findIndex(m => m.id === matchId);
          
          // For round 0, we need to account for bye participants
          let nextMatchIndex: number;
          let isFirstPlayer: boolean;
          
          if (match.round === 0) {
            // Round 0 (Round 1) winners advance to Round 1 (Round 2)
            // R2 matches are ordered: bye vs bye, then bye vs R1winner, then R1winner vs R1winner
            // Need to find the next null slot for an R1 winner
            const round2Matches = tournament.knockoutBracket.rounds[1];
            let nullSlotCount = 0;
            
            // Find which R1 winner this is (0, 1, 2, ...)
            for (let i = 0; i < round2Matches.length; i++) {
              const r2match = round2Matches[i];
              
              // Check player1 slot
              if (r2match.player1 === null) {
                if (nullSlotCount === matchPositionInRound) {
                  nextMatchIndex = i;
                  isFirstPlayer = true;
                  break;
                }
                nullSlotCount++;
              }
              
              // Check player2 slot
              if (r2match.player2 === null) {
                if (nullSlotCount === matchPositionInRound) {
                  nextMatchIndex = i;
                  isFirstPlayer = false;
                  break;
                }
                nullSlotCount++;
              }
            }
          } else {
            nextMatchIndex = Math.floor(matchPositionInRound / 2);
            isFirstPlayer = matchPositionInRound % 2 === 0;
          }
          
          const nextMatch = tournament.knockoutBracket.rounds[nextRound][nextMatchIndex];
          
          if (nextMatch) {
            updatedMatches.forEach(m => {
              if (m.id === nextMatch.id) {
                if (isFirstPlayer) {
                  m.player1 = winner;
                } else {
                  m.player2 = winner;
                }
              }
            });
            
            // Also update the knockout bracket rounds to reflect the winner advancement
            updatedBracket = {
              ...tournament.knockoutBracket,
              rounds: tournament.knockoutBracket.rounds.map((round, rIdx) => {
                if (rIdx === nextRound) {
                  return round.map((roundMatch, mIdx) => {
                    if (mIdx === nextMatchIndex) {
                      if (isFirstPlayer) {
                        return { ...roundMatch, player1: winner };
                      } else {
                        return { ...roundMatch, player2: winner };
                      }
                    }
                    return roundMatch;
                  });
                }
                if (rIdx === match.round) {
                  return round.map(roundMatch => {
                    if (roundMatch.id === matchId) {
                      return { ...roundMatch, winner, score1, score2 };
                    }
                    return roundMatch;
                  });
                }
                return round;
              })
            };
          }
        } else {
          // Just update the current match in bracket
          updatedBracket = {
            ...tournament.knockoutBracket,
            rounds: tournament.knockoutBracket.rounds.map((round, rIdx) => {
              if (rIdx === match.round) {
                return round.map(roundMatch => {
                  if (roundMatch.id === matchId) {
                    return { ...roundMatch, winner, score1, score2 };
                  }
                  return roundMatch;
                });
              }
              return round;
            })
          };
        }
      }
    }

    setTournament({
      ...tournament,
      matches: updatedMatches,
      knockoutBracket: updatedBracket
    });
  };

  const handleRestart = () => {
    setStep('initial');
    setTournament(null);
    setParticipants([]);
  };

  return (
    <div className="app">
      {step === 'initial' && (
        <TournamentSetup onComplete={handleInitialSetup} />
      )}

      {step === 'participants' && (
        <ParticipantSetup
          count={participantCount}
          onComplete={handleParticipantsComplete}
          onBack={() => setStep('initial')}
        />
      )}

      {step === 'config' && (
        <TournamentConfig
          mode={mode}
          participants={participants}
          onComplete={handleConfigComplete}
          onBack={() => setStep('participants')}
        />
      )}

      {step === 'tournament' && tournament && (
        <>
          <TournamentView
            tournament={tournament}
            onUpdateMatch={handleUpdateMatch}
          />
          <div className="restart-container">
            <button onClick={handleRestart} className="secondary restart-button">
              Neues Turnier starten
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

