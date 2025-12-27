import React, { useState, useEffect } from 'react';
import './ScoreInput.css';

interface ScoreInputProps {
  player1Name: string;
  player2Name: string;
  initialScore1?: number;
  initialScore2?: number;
  onSubmit: (score1: number, score2: number) => void;
  onClear?: () => void;
  isEditing?: boolean;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ 
  player1Name, 
  player2Name, 
  initialScore1,
  initialScore2,
  onSubmit,
  onClear,
  isEditing = false
}) => {
  const [score1, setScore1] = useState<string>(initialScore1?.toString() || '');
  const [score2, setScore2] = useState<string>(initialScore2?.toString() || '');

  useEffect(() => {
    setScore1(initialScore1?.toString() || '');
    setScore2(initialScore2?.toString() || '');
  }, [initialScore1, initialScore2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    
    if (!isNaN(s1) && !isNaN(s2) && s1 >= 0 && s2 >= 0) {
      onSubmit(s1, s2);
      if (!isEditing) {
        setScore1('');
        setScore2('');
      }
    }
  };

  return (
    <form className="score-input" onSubmit={handleSubmit}>
      <div className="score-field">
        <label>{player1Name.split(' ')[0]}</label>
        <input
          type="number"
          min="0"
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          placeholder="0"
          required
        />
      </div>
      <span className="score-separator">:</span>
      <div className="score-field">
        <label>{player2Name.split(' ')[0]}</label>
        <input
          type="number"
          min="0"
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          placeholder="0"
          required
        />
      </div>
      <button type="submit">{isEditing ? 'Aktualisieren' : 'Eintragen'}</button>
      {isEditing && onClear && (
        <button type="button" onClick={onClear} className="clear-button">
          Zurücksetzen
        </button>
      )}
    </form>
  );
};

export default ScoreInput;
