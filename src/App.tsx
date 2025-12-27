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
        return { ...match, winner, score1, score2 };
      }
      return match;
    });

    // If knockout, advance winner to next round
    if (tournament.knockoutBracket) {
      const matchIndex = tournament.matches.findIndex(m => m.id === matchId);
      const match = tournament.matches[matchIndex];
      
      if (match.round !== undefined) {
        const nextRound = match.round + 1;
        if (nextRound < tournament.knockoutBracket.rounds.length) {
          const matchPositionInRound = tournament.knockoutBracket.rounds[match.round].findIndex(m => m.id === matchId);
          const nextMatchIndex = Math.floor(matchPositionInRound / 2);
          const nextMatch = tournament.knockoutBracket.rounds[nextRound][nextMatchIndex];
          
          const isFirstPlayer = matchPositionInRound % 2 === 0;
          
          updatedMatches.forEach(m => {
            if (m.id === nextMatch.id) {
              if (isFirstPlayer) {
                m.player1 = winner;
              } else {
                m.player2 = winner;
              }
            }
          });
        }
      }
    }

    setTournament({
      ...tournament,
      matches: updatedMatches
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

