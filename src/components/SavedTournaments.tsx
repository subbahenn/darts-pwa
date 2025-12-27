import React from 'react';
import type { Tournament } from '../types';
import './SavedTournaments.css';

interface SavedTournamentsProps {
  tournaments: Tournament[];
  onLoad: (tournament: Tournament) => void;
  onDelete: (tournamentId: string) => void;
  onClose: () => void;
}

const SavedTournaments: React.FC<SavedTournamentsProps> = ({
  tournaments,
  onLoad,
  onDelete,
  onClose
}) => {
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'group':
        return 'Gruppe';
      case 'knockout':
        return 'KO';
      case 'group-knockout':
        return 'Gruppe + KO';
      default:
        return mode;
    }
  };

  const getStatusLabel = (tournament: Tournament) => {
    if (tournament.completed) {
      return 'Abgeschlossen';
    }
    const completedMatches = tournament.matches.filter(m => m.winner).length;
    const totalMatches = tournament.matches.length;
    return `${completedMatches}/${totalMatches} Spiele`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Gespeicherte Turniere</h2>
        
        {tournaments.length === 0 ? (
          <p className="no-tournaments">Keine gespeicherten Turniere</p>
        ) : (
          <div className="tournament-list">
            {tournaments.map(tournament => (
              <div key={tournament.id} className="tournament-card">
                <div className="tournament-info">
                  <h3>{getModeLabel(tournament.config.mode)} - {tournament.config.participants.length} Spieler</h3>
                  <p className="tournament-status">{getStatusLabel(tournament)}</p>
                  <p className="tournament-date">
                    Turnier-ID: {tournament.id.substring(0, 8)}
                  </p>
                </div>
                <div className="tournament-actions">
                  <button onClick={() => onLoad(tournament)} className="load-button">
                    Laden
                  </button>
                  <button onClick={() => onDelete(tournament.id)} className="delete-button">
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="modal-footer">
          <button onClick={onClose} className="close-button">Schließen</button>
        </div>
      </div>
    </div>
  );
};

export default SavedTournaments;
