import React, { useState } from 'react';
import type { Participant } from '../types';
import { loadParticipants, generateId } from '../utils';
import './ParticipantSetup.css';

interface ParticipantSetupProps {
  count: number;
  onComplete: (participants: Participant[]) => void;
  onBack: () => void;
}

const ParticipantSetup: React.FC<ParticipantSetupProps> = ({ count, onComplete, onBack }) => {
  const [savedParticipants] = useState<Participant[]>(() => loadParticipants());
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const initial: Participant[] = [];
    for (let i = 0; i < count; i++) {
      initial.push({
        id: generateId(),
        name: ''
      });
    }
    return initial;
  });

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
          {participants.map((participant, index) => {
            // Filter out already selected participants from the dropdown
            const availableParticipants = savedParticipants.filter(sp => {
              // Don't filter out the current participant's own name
              if (sp.name === participant.name) return true;
              // Filter out names that are already selected by other participants
              return !participants.some((p, i) => i !== index && p.name === sp.name);
            });
            
            return (
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
                {availableParticipants.length > 0 && (
                  <datalist id={`saved-participants-${index}`}>
                    {availableParticipants.map(sp => (
                      <option key={sp.id} value={sp.name} />
                    ))}
                  </datalist>
                )}
              </div>
            );
          })}
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
