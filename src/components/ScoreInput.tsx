import React, { useState } from 'react';
import './ScoreInput.css';

interface ScoreInputProps {
  player1Name: string;
  player2Name: string;
  onSubmit: (score1: number, score2: number) => void;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ player1Name, player2Name, onSubmit }) => {
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    
    if (!isNaN(s1) && !isNaN(s2) && s1 >= 0 && s2 >= 0) {
      onSubmit(s1, s2);
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
      <button type="submit">Eintragen</button>
    </form>
  );
};

export default ScoreInput;
