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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Kein Datum';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Use date-only comparison to handle timezone correctly
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format: DD.MM.YYYY HH:MM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const dateStr = `${day}.${month}.${year} ${hours}:${minutes}`;
    
    if (diffDays === 0) {
      return `Heute, ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return `Gestern, ${hours}:${minutes}`;
    } else if (diffDays < 7) {
      return `Vor ${diffDays} Tagen`;
    }
    
    return dateStr;
  };

  const getStatusLabel = (tournament: Tournament) => {
    if (tournament.completed) {
      return 'Abgeschlossen';
    }
    const completedMatches = tournament.matches.filter(m => m.winner).length;
    const totalMatches = tournament.matches.length;
    return `${completedMatches}/${totalMatches} Spiele`;
  };

  const handleDelete = (tournamentId: string) => {
    onDelete(tournamentId);
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
                    {formatDate(tournament.createdAt)}
                  </p>
                </div>
                <div className="tournament-actions">
                  <button onClick={() => onLoad(tournament)} className="load-button">
                    Laden
                  </button>
                  <button onClick={() => handleDelete(tournament.id)} className="delete-button">
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
