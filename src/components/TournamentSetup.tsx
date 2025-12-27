import React, { useState } from 'react';
import type { TournamentMode } from '../types';
import './TournamentSetup.css';

interface TournamentSetupProps {
  onComplete: (mode: TournamentMode, participantCount: number) => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ onComplete }) => {
  const [participantCount, setParticipantCount] = useState<number>(8);
  const [mode, setMode] = useState<TournamentMode>('knockout');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (participantCount < 2) {
      alert('Mindestens 2 Teilnehmer erforderlich.');
      return;
    }
    
    onComplete(mode, participantCount);
  };

  return (
    <div className="tournament-setup">
      <div className="setup-header">
        <h1>🎯 Darts Turnier</h1>
        <p>Erstellen Sie Ihr Darts-Turnier</p>
      </div>
      
      <form onSubmit={handleSubmit} className="setup-form">
        <div className="form-group">
          <label htmlFor="participant-count">
            <strong>Anzahl der Teilnehmer</strong>
          </label>
          <input
            id="participant-count"
            type="number"
            min="2"
            max="128"
            value={participantCount}
            onChange={(e) => setParticipantCount(parseInt(e.target.value) || 2)}
            required
          />
          <small>Mindestens 2 Teilnehmer</small>
        </div>

        <div className="form-group">
          <label>
            <strong>Turniermodus</strong>
          </label>
          
          <div className="mode-options">
            <button
              type="button"
              className={`mode-button ${mode === 'group' ? 'active' : ''}`}
              onClick={() => setMode('group')}
            >
              <div className="mode-icon">👥</div>
              <div className="mode-title">Gruppenmodus</div>
              <div className="mode-description">
                Nur Gruppenphase, alle spielen gegen alle in ihrer Gruppe
              </div>
            </button>

            <button
              type="button"
              className={`mode-button ${mode === 'knockout' ? 'active' : ''}`}
              onClick={() => setMode('knockout')}
            >
              <div className="mode-icon">🏆</div>
              <div className="mode-title">KO-Modus</div>
              <div className="mode-description">
                Direkte Ausscheidung im Turnierbaum
              </div>
            </button>

            <button
              type="button"
              className={`mode-button ${mode === 'group-knockout' ? 'active' : ''}`}
              onClick={() => setMode('group-knockout')}
            >
              <div className="mode-icon">🌟</div>
              <div className="mode-title">Gruppe + KO</div>
              <div className="mode-description">
                Gruppenphase gefolgt von KO-Runde (wie WM)
              </div>
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button">
            Weiter
          </button>
        </div>
      </form>
    </div>
  );
};

export default TournamentSetup;
