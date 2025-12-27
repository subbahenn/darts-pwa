import React, { useState, useEffect } from 'react';
import type { Participant } from '../types';
import { loadParticipants, generateId } from '../utils';
import './ParticipantSetup.css';

interface ParticipantSetupProps {
  count: number;
  onComplete: (participants: Participant[]) => void;
  onBack: () => void;
}

const ParticipantSetup: React.FC<ParticipantSetupProps> = ({ count, onComplete, onBack }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [savedParticipants, setSavedParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    // Load saved participants
    const saved = loadParticipants();
    setSavedParticipants(saved);
    
    // Initialize with empty participants
    const initial: Participant[] = [];
    for (let i = 0; i < count; i++) {
      initial.push({
        id: generateId(),
        name: ''
      });
    }
    setParticipants(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], name };
    setParticipants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out participants without names
    const validParticipants = participants.filter(p => p.name.trim() !== '');
    
    if (validParticipants.length < 2) {
      alert('Bitte geben Sie mindestens 2 Teilnehmer ein.');
      return;
    }
    
    onComplete(validParticipants);
  };

  const allFilled = participants.every(p => p.name.trim() !== '');

  return (
    <div className="participant-setup">
      <h2>Teilnehmer eingeben</h2>
      <p className="subtitle">{count} Teilnehmer</p>
      
      <form onSubmit={handleSubmit}>
        <div className="participants-grid">
          {participants.map((participant, index) => (
            <div key={participant.id} className="participant-input-group">
              <label htmlFor={`participant-${index}`}>
                Spieler {index + 1}
              </label>
              <input
                id={`participant-${index}`}
                type="text"
                value={participant.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`Name für Spieler ${index + 1}`}
                list={`saved-participants-${index}`}
              />
              {savedParticipants.length > 0 && (
                <datalist id={`saved-participants-${index}`}>
                  {savedParticipants.map(sp => (
                    <option key={sp.id} value={sp.name} />
                  ))}
                </datalist>
              )}
            </div>
          ))}
        </div>
        
        {savedParticipants.length > 0 && (
          <div className="saved-participants-info">
            <small>
              Tipp: Beginnen Sie mit der Eingabe, um gespeicherte Teilnehmer zu sehen
            </small>
          </div>
        )}
        
        <div className="actions">
          <button type="button" onClick={onBack} className="secondary">
            Zurück
          </button>
          <button type="submit" disabled={!allFilled}>
            Weiter
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParticipantSetup;
