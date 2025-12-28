import { useState, useEffect } from 'react';
import TournamentSetup from './components/TournamentSetup';
import ParticipantSetup from './components/ParticipantSetup';
import TournamentConfig from './components/TournamentConfig';
import TournamentView from './components/TournamentView';
import SavedTournaments from './components/SavedTournaments';
import Toast from './components/Toast';
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
  const [showSavedTournaments, setShowSavedTournaments] = useState<boolean>(false);
  const [tournamentsRefreshKey, setTournamentsRefreshKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

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
      newTournament.matches = bracket.rounds.flat();
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
        // Empty string means match not complete yet - keep winner as null
        // 'draw' means draw result for group matches
        // Otherwise, winner is a player ID
        const finalWinner = winner === '' ? null : winner;
        return { ...match, winner: finalWinner, score1, score2 };
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
          
          // Standard bracket advancement: match i advances to match floor(i/2) in next round
          const nextMatchIndex = Math.floor(matchPositionInRound / 2);
          const isFirstPlayer = matchPositionInRound % 2 === 0;
          
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
          // Just update the current match in bracket (this is the final)
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
    
    // Auto-save tournament to localStorage
    saveTournamentToStorage({
      ...tournament,
      matches: updatedMatches,
      knockoutBracket: updatedBracket
    });
  };

  // Save tournament to localStorage
  const saveTournamentToStorage = (tournamentToSave: Tournament) => {
    const savedTournaments = getSavedTournaments();
    const existingIndex = savedTournaments.findIndex(t => t.id === tournamentToSave.id);
    
    if (existingIndex >= 0) {
      savedTournaments[existingIndex] = tournamentToSave;
    } else {
      savedTournaments.push(tournamentToSave);
    }
    
    localStorage.setItem('savedTournaments', JSON.stringify(savedTournaments));
  };

  // Get saved tournaments from localStorage
  const getSavedTournaments = (): Tournament[] => {
    const saved = localStorage.getItem('savedTournaments');
    return saved ? JSON.parse(saved) : [];
  };

  // Load tournament
  const handleLoadTournament = (loadedTournament: Tournament) => {
    setTournament(loadedTournament);
    setStep('tournament');
    setShowSavedTournaments(false);
    showToastMessage('Turnier geladen!');
  };

  // Delete tournament
  const handleDeleteTournament = (tournamentId: string) => {
    const savedTournaments = getSavedTournaments();
    const filtered = savedTournaments.filter(t => t.id !== tournamentId);
    localStorage.setItem('savedTournaments', JSON.stringify(filtered));
    // Force re-render of tournaments list
    setTournamentsRefreshKey(prev => prev + 1);
    showToastMessage('Turnier gelöscht!');
  };

  const handleRestart = () => {
    setStep('initial');
    setTournament(null);
    setParticipants([]);
  };

  return (
    <div className="app">
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        aria-label="Theme umschalten"
        title={theme === 'light' ? 'Zum Dunkelmodus wechseln' : 'Zum Hellmodus wechseln'}
      >
        {theme === 'light' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={(step === 'initial' || step === 'participants') ? 'var(--accent-color)' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={(step === 'initial' || step === 'participants') ? 'var(--accent-color)' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      {step === 'initial' && (
        <TournamentSetup 
          onComplete={handleInitialSetup}
          onLoadTournaments={() => setShowSavedTournaments(true)}
        />
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

      {showSavedTournaments && (
        <SavedTournaments
          key={tournamentsRefreshKey}
          tournaments={getSavedTournaments()}
          onLoad={handleLoadTournament}
          onDelete={handleDeleteTournament}
          onClose={() => setShowSavedTournaments(false)}
        />
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

export default App;

