import React, { useState } from 'react';
import type { TournamentMode, TournamentConfig, Participant } from '../types';
import { suggestTournamentConfig } from '../tournamentLogic';
import './TournamentConfig.css';

interface TournamentConfigProps {
  mode: TournamentMode;
  participants: Participant[];
  onComplete: (config: TournamentConfig) => void;
  onBack: () => void;
}

const TournamentConfigComponent: React.FC<TournamentConfigProps> = ({
  mode,
  participants,
  onComplete,
  onBack
}) => {
  const suggestions = suggestTournamentConfig(participants.length, mode);
  
  const [groupCount, setGroupCount] = useState<number>(suggestions.groupCount || 4);
  const [matchesPerOpponent, setMatchesPerOpponent] = useState<number>(
    suggestions.matchesPerOpponent || 1
  );
  const [bestOf, setBestOf] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: TournamentConfig = {
      mode,
      participantCount: participants.length,
      participants,
      groupCount: mode !== 'knockout' ? groupCount : undefined,
      matchesPerOpponent: mode !== 'knockout' ? matchesPerOpponent : undefined,
      bestOf
    };
    
    onComplete(config);
  };

  const maxGroups = Math.floor(participants.length / 2);

  return (
    <div className="tournament-config">
      <h2>Turnier Konfiguration</h2>
      <p className="subtitle">
        {participants.length} Teilnehmer • {mode === 'group' ? 'Gruppenmodus' : mode === 'knockout' ? 'KO-Modus' : 'Gruppe + KO'}
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="config-section">
          <label htmlFor="best-of">
            <strong>Best of</strong>
          </label>
          <select
            id="best-of"
            value={bestOf}
            onChange={(e) => setBestOf(parseInt(e.target.value))}
            required
          >
            <option value="1">Best of 1 (1 Leg)</option>
            {mode !== 'knockout' && <option value="2">Best of 2 (2 Legs)</option>}
            <option value="3">Best of 3 (3 Legs)</option>
            {mode !== 'knockout' && <option value="4">Best of 4 (4 Legs)</option>}
            <option value="5">Best of 5 (5 Legs)</option>
            {mode !== 'knockout' && <option value="6">Best of 6 (6 Legs)</option>}
            <option value="7">Best of 7 (7 Legs)</option>
            {mode !== 'knockout' && <option value="8">Best of 8 (8 Legs)</option>}
            <option value="9">Best of 9 (9 Legs)</option>
          </select>
          <small className="help-text">
            Best of X: Ein Spieler muss mehr als die Hälfte der Legs gewinnen.{mode !== 'knockout' && ' Gerade Zahlen ermöglichen Unentschieden in der Gruppenphase.'}
          </small>
        </div>

        {mode !== 'knockout' && (
          <>
            <div className="config-section">
              <label htmlFor="group-count">
                <strong>Anzahl der Gruppen</strong>
              </label>
              <input
                id="group-count"
                type="number"
                min="1"
                max={maxGroups}
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                required
              />
              <small className="help-text">
                Empfohlen: {suggestions.groupCount} Gruppen
                {' • '}
                ca. {Math.ceil(participants.length / groupCount)} Spieler pro Gruppe
              </small>
            </div>

            <div className="config-section">
              <label htmlFor="matches-per-opponent">
                <strong>Spiele pro Gegner</strong>
              </label>
              <select
                id="matches-per-opponent"
                value={matchesPerOpponent}
                onChange={(e) => setMatchesPerOpponent(parseInt(e.target.value))}
                required
              >
                <option value="1">1 Spiel (Einfache Runde)</option>
                <option value="2">2 Spiele (Hin- und Rückrunde)</option>
              </select>
              <small className="help-text">
                Wie oft soll jeder Spieler gegen jeden anderen Spieler in seiner Gruppe spielen?
              </small>
            </div>
          </>
        )}

        {mode === 'knockout' && (
          <div className="config-info">
            <div className="info-card">
              <h3>KO-Turnierbaum</h3>
              <p>
                Das Turnier wird als direktes Ausscheidungsturnier durchgeführt.
              </p>
              {(() => {
                const nextPow2 = Math.pow(2, Math.ceil(Math.log2(participants.length)));
                const byeCount = nextPow2 - participants.length;
                if (byeCount > 0) {
                  return (
                    <p className="bye-info">
                      <strong>Freilose:</strong> {byeCount} {byeCount === 1 ? 'Spieler zieht' : 'Spieler ziehen'} direkt in Runde 2 ein
                      {' '}(da {participants.length} Teilnehmer keine Zweierpotenz sind).
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {mode === 'group-knockout' && (
          <div className="config-info">
            <div className="info-card">
              <h3>Turnierverlauf</h3>
              <ol>
                <li>
                  <strong>Gruppenphase:</strong> {groupCount} Gruppen spielen im Rundenmodus
                </li>
                <li>
                  <strong>Qualifikation:</strong> Die Top 2 jeder Gruppe qualifizieren sich
                </li>
                <li>
                  <strong>KO-Phase:</strong> Qualifizierte Spieler spielen im Turnierbaum
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="actions">
          <button type="button" onClick={onBack} className="secondary">
            Zurück
          </button>
          <button type="submit">
            Turnier starten
          </button>
        </div>
      </form>
    </div>
  );
};

export default TournamentConfigComponent;
