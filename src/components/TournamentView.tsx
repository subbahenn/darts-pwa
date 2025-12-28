import React from 'react';
import type { Match, Participant, GroupStanding, Tournament, Group } from '../types';
import './TournamentView.css';

interface TournamentViewProps {
  tournament: Tournament;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
  onSaveTournament?: () => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ tournament, onUpdateMatch, onSaveTournament }) => {
  const [currentView, setCurrentView] = React.useState<'overview' | 'table' | 'bracket'>('overview');
  const [showWinnerModal, setShowWinnerModal] = React.useState<boolean>(false);
  const hasShownWinnerModal = React.useRef<boolean>(false);

  const getParticipantName = (id: string | null): string => {
    if (!id) return 'TBD';
    const participant = tournament.config.participants.find((p: Participant) => p.id === id);
    return participant?.name || 'TBD';
  };

  // Get tournament winner if exists
  const getTournamentWinner = (): { id: string; name: string } | null => {
    // For knockout tournaments, check if the final match has a winner
    if (tournament.knockoutBracket && tournament.knockoutBracket.rounds.length > 0) {
      const finalRound = tournament.knockoutBracket.rounds[tournament.knockoutBracket.rounds.length - 1];
      if (finalRound.length > 0) {
        const finalMatch = finalRound[0];
        // Find the match in tournament.matches to get the latest data
        const currentFinalMatch = tournament.matches.find(m => m.id === finalMatch.id);
        if (currentFinalMatch && currentFinalMatch.winner && currentFinalMatch.winner !== 'draw') {
          return {
            id: currentFinalMatch.winner,
            name: getParticipantName(currentFinalMatch.winner)
          };
        }
      }
    }
    // For group-only tournaments, get the top player from standings
    if (tournament.config.mode === 'group' && tournament.groups && tournament.groups.length > 0) {
      const standings = calculateGroupStandings();
      // Get all standings and find the overall winner
      const allStandings = Array.from(standings.values()).flat();
      if (allStandings.length > 0) {
        const winner = allStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return 0;
        })[0];
        // Only show winner if all matches are complete (have a winner or draw)
        const allMatchesComplete = tournament.matches.every(m => m.winner !== null);
        if (allMatchesComplete && winner) {
          return {
            id: winner.participantId,
            name: winner.participantName
          };
        }
      }
    }
    return null;
  };

  const calculateGroupStandings = (): Map<string, GroupStanding[]> => {
    const standingsMap = new Map<string, GroupStanding[]>();
    
    if (!tournament.groups) return standingsMap;

    tournament.groups.forEach((group: Group) => {
      const standings: GroupStanding[] = group.participants.map((pId: string) => ({
        participantId: pId,
        participantName: getParticipantName(pId),
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }));

      // Calculate standings from matches
      tournament.matches
        .filter((m: Match) => m.groupId === group.id && m.winner && m.winner !== '' && m.score1 !== undefined && m.score2 !== undefined)
        .forEach((match: Match) => {
          const p1Standing = standings.find(s => s.participantId === match.player1);
          const p2Standing = standings.find(s => s.participantId === match.player2);

          if (p1Standing && p2Standing) {
            p1Standing.played++;
            p2Standing.played++;
            
            const score1 = match.score1!;
            const score2 = match.score2!;
            
            p1Standing.goalsFor += score1;
            p1Standing.goalsAgainst += score2;
            p2Standing.goalsFor += score2;
            p2Standing.goalsAgainst += score1;

            if (match.winner === match.player1) {
              p1Standing.won++;
              p1Standing.points += 2;
              p2Standing.lost++;
            } else if (match.winner === match.player2) {
              p2Standing.won++;
              p2Standing.points += 2;
              p1Standing.lost++;
            } else {
              // Draw
              p1Standing.drawn++;
              p2Standing.drawn++;
              p1Standing.points += 1;
              p2Standing.points += 1;
            }
            
            p1Standing.goalDifference = p1Standing.goalsFor - p1Standing.goalsAgainst;
            p2Standing.goalDifference = p2Standing.goalsFor - p2Standing.goalsAgainst;
          }
        });

      // Sort by points, then goal difference, then goals for
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.participantName.localeCompare(b.participantName);
      });

      standingsMap.set(group.id, standings);
    });

    return standingsMap;
  };

  const groupStandings = calculateGroupStandings();
  const winner = getTournamentWinner();

  // Show modal when winner is determined (only once)
  React.useEffect(() => {
    if (winner && !hasShownWinnerModal.current) {
      setShowWinnerModal(true);
      hasShownWinnerModal.current = true;
    }
  }, [winner]);

  return (
    <div className="tournament-view">
      <header className="tournament-header">
        <h1>🎯 Darts Turnier</h1>
        <div className="tournament-actions">
          {onSaveTournament && (
            <button className="action-btn" onClick={onSaveTournament}>
              💾 Turnier speichern
            </button>
          )}
        </div>
        <div className="view-tabs">
          <button
            className={currentView === 'overview' ? 'active' : ''}
            onClick={() => setCurrentView('overview')}
          >
            Übersicht
          </button>
          {(tournament.config.mode === 'group' || tournament.config.mode === 'group-knockout') && (
            <button
              className={currentView === 'table' ? 'active' : ''}
              onClick={() => setCurrentView('table')}
            >
              Tabelle
            </button>
          )}
          {(tournament.config.mode === 'knockout' || tournament.config.mode === 'group-knockout') && (
            <button
              className={currentView === 'bracket' ? 'active' : ''}
              onClick={() => setCurrentView('bracket')}
            >
              Turnierbaum
            </button>
          )}
        </div>
      </header>

      {winner && showWinnerModal && (
        <div className="winner-announcement" onClick={() => setShowWinnerModal(false)}>
          <div className="winner-content" onClick={(e) => e.stopPropagation()}>
            <div className="winner-trophy">🏆</div>
            <div className="winner-title">Turniersieger</div>
            <div className="winner-name">{winner.name}</div>
            <div className="winner-confetti">🎉</div>
            <button className="winner-close-button" onClick={() => setShowWinnerModal(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="tournament-content">
        {currentView === 'overview' && (
          <OverviewView
            tournament={tournament}
            groupStandings={groupStandings}
            getParticipantName={getParticipantName}
            onUpdateMatch={onUpdateMatch}
          />
        )}

        {currentView === 'table' && (
          <TableView
            tournament={tournament}
            groupStandings={groupStandings}
          />
        )}

        {currentView === 'bracket' && (
          <BracketView
            tournament={tournament}
            getParticipantName={getParticipantName}
            onUpdateMatch={onUpdateMatch}
            bestOf={tournament.config.bestOf || 3}
          />
        )}
      </div>
    </div>
  );
};

// Overview View Component
interface OverviewViewProps {
  tournament: Tournament;
  groupStandings: Map<string, GroupStanding[]>;
  getParticipantName: (id: string | null) => string;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({ tournament, groupStandings, getParticipantName, onUpdateMatch }) => {
  const isGroupTournament = tournament.config.mode === 'group' || tournament.config.mode === 'group-knockout';
  
  return (
    <div className={`overview-view ${isGroupTournament ? 'group-layout' : ''}`}>
      {/* Match schedule */}
      <div className="matches-section card">
        <h2>Spielplan</h2>
        <MatchList
          matches={tournament.matches}
          groups={tournament.groups}
          getParticipantName={getParticipantName}
          onUpdateMatch={onUpdateMatch}
          bestOf={tournament.config.bestOf || 3}
        />
      </div>

      {/* Full standings table for group tournaments on wide screens */}
      {isGroupTournament && groupStandings.size > 0 && (
        <div className="standings-sidebar">
          {tournament.groups?.map((group: Group) => {
            const standings: GroupStanding[] = groupStandings.get(group.id) || [];
            return (
              <div key={group.id} className="group-standings card">
                <h2>Tabelle {tournament.groups!.length > 1 ? group.name : ''}</h2>
                <table className="full-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Spieler</th>
                      <th>Sp</th>
                      <th>S</th>
                      <th>U</th>
                      <th>N</th>
                      <th>Legs</th>
                      <th>Diff</th>
                      <th>Pkt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr key={standing.participantId} className={index < 2 ? 'qualified' : ''}>
                        <td>{index + 1}</td>
                        <td><strong>{standing.participantName}</strong></td>
                        <td>{standing.played}</td>
                        <td>{standing.won}</td>
                        <td>{standing.drawn}</td>
                        <td>{standing.lost}</td>
                        <td>{standing.goalsFor}:{standing.goalsAgainst}</td>
                        <td className={standing.goalDifference > 0 ? 'positive' : standing.goalDifference < 0 ? 'negative' : ''}>
                          {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                        </td>
                        <td><strong>{standing.points}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Table View Component
interface TableViewProps {
  tournament: Tournament;
  groupStandings: Map<string, GroupStanding[]>;
}

const TableView: React.FC<TableViewProps> = ({ tournament, groupStandings }) => {
  return (
    <div className="table-view">
      {tournament.groups?.map((group: Group) => {
        const standings: GroupStanding[] = groupStandings.get(group.id) || [];
        return (
          <div key={group.id} className="group-standings card">
            <h2>Gruppe {group.name}</h2>
            <table className="full-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Spieler</th>
                  <th>Spiele</th>
                  <th>S</th>
                  <th>U</th>
                  <th>N</th>
                  <th>Legs</th>
                  <th>Diff</th>
                  <th>Punkte</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.participantId} className={index < 2 ? 'qualified' : ''}>
                    <td>{index + 1}</td>
                    <td><strong>{standing.participantName}</strong></td>
                    <td>{standing.played}</td>
                    <td>{standing.won}</td>
                    <td>{standing.drawn}</td>
                    <td>{standing.lost}</td>
                    <td>{standing.goalsFor}:{standing.goalsAgainst}</td>
                    <td className={standing.goalDifference > 0 ? 'positive' : standing.goalDifference < 0 ? 'negative' : ''}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </td>
                    <td><strong>{standing.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

// Bracket View Component
interface BracketViewProps {
  tournament: Tournament;
  getParticipantName: (id: string | null) => string;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
  bestOf: number;
}

const BracketView: React.FC<BracketViewProps> = ({ tournament, getParticipantName, onUpdateMatch, bestOf }) => {
  const [editingMatchId, setEditingMatchId] = React.useState<string | null>(null);
  
  if (!tournament.knockoutBracket) {
    return <div className="card">Kein Turnierbaum verfügbar</div>;
  }

  // Get current match data from tournament.matches to ensure sync
  const getMatchData = (matchId: string): Match | undefined => {
    return tournament.matches.find(m => m.id === matchId);
  };

  return (
    <div className="bracket-view">
      <div className="bracket-container">
        {tournament.knockoutBracket?.rounds.map((round: Match[], roundIndex: number) => (
          <div key={roundIndex} className="bracket-round">
            <h3>
              {roundIndex === (tournament.knockoutBracket?.rounds.length ?? 0) - 1
                ? 'Finale'
                : `Runde ${roundIndex + 1}`}
            </h3>
            <div className="bracket-matches">
              {round.map((roundMatch: Match) => {
                // Get the latest match data from tournament.matches
                const currentMatch = getMatchData(roundMatch.id) || roundMatch;
                const isEditing = editingMatchId === currentMatch.id;
                const hasResult = currentMatch.winner !== null && currentMatch.score1 !== undefined && currentMatch.score2 !== undefined;
                
                const [score1, setScore1] = React.useState<string>(currentMatch.score1?.toString() || '0');
                const [score2, setScore2] = React.useState<string>(currentMatch.score2?.toString() || '0');
                
                // Sync state with match data when it changes
                React.useEffect(() => {
                  setScore1(currentMatch.score1?.toString() || '0');
                  setScore2(currentMatch.score2?.toString() || '0');
                }, [currentMatch.score1, currentMatch.score2]);
                
                // Auto-update match when scores change
                const handleScoreChange = (newScore1: string, newScore2: string) => {
                  const s1 = parseInt(newScore1) || 0;
                  const s2 = parseInt(newScore2) || 0;
                  
                  if (s1 >= 0 && s2 >= 0) {
                    // Calculate minimum legs needed to win
                    // For Best of X: need to win more than half, i.e., ceil(bestOf/2) legs
                    const legsToWin = Math.ceil(bestOf / 2);
                    
                    // Check if match is complete (someone has won enough legs)
                    if (s1 >= legsToWin || s2 >= legsToWin) {
                      const winner = s1 > s2 ? currentMatch.player1! : currentMatch.player2!;
                      onUpdateMatch(currentMatch.id, winner, s1, s2);
                      setEditingMatchId(null);
                    } else {
                      // Match not complete yet, don't set a winner
                      // Pass empty string to indicate scores updated but no winner yet
                      onUpdateMatch(currentMatch.id, '', s1, s2);
                    }
                  }
                };
                
                const handleScore1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const newScore1 = e.target.value;
                  setScore1(newScore1);
                  // Use current score2 state value
                  handleScoreChange(newScore1, score2);
                };
                
                const handleScore2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const newScore2 = e.target.value;
                  setScore2(newScore2);
                  // Use current score1 state value
                  handleScoreChange(score1, newScore2);
                };
                
                return (
                  <div key={currentMatch.id} className="bracket-match card">
                    {/* Vertical bracket match display with inline inputs */}
                    <div className="bracket-match-inline">
                      <div className="bracket-match-content">
                        <div className={`bracket-player-line ${currentMatch.winner === currentMatch.player1 ? 'winner' : ''}`}>
                          <span className="bracket-player-name">{getParticipantName(currentMatch.player1)}</span>
                          {(!currentMatch.winner || isEditing) && currentMatch.player1 && currentMatch.player2 ? (
                            <input
                              type="number"
                              min="0"
                              max={bestOf}
                              className="bracket-score-input"
                              value={score1}
                              onChange={handleScore1Change}
                            />
                          ) : (
                            <span className="bracket-score">{currentMatch.score1 !== undefined ? currentMatch.score1 : '-'}</span>
                          )}
                        </div>
                        <div className={`bracket-player-line ${currentMatch.winner === currentMatch.player2 ? 'winner' : ''}`}>
                          <span className="bracket-player-name">{getParticipantName(currentMatch.player2)}</span>
                          {(!currentMatch.winner || isEditing) && currentMatch.player1 && currentMatch.player2 ? (
                            <input
                              type="number"
                              min="0"
                              max={bestOf}
                              className="bracket-score-input"
                              value={score2}
                              onChange={handleScore2Change}
                            />
                          ) : (
                            <span className="bracket-score">{currentMatch.score2 !== undefined ? currentMatch.score2 : '-'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasResult && !isEditing && currentMatch.player1 && currentMatch.player2 && (
                      <button 
                        className="edit-result-button"
                        onClick={() => setEditingMatchId(currentMatch.id)}
                      >
                        Ändern
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Match List Component
interface MatchListProps {
  matches: Match[];
  groups?: Group[]; // Add groups to get proper names
  getParticipantName: (id: string | null) => string;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
  bestOf: number; // Best of x - first to win more than x/2 legs wins
}

const MatchList: React.FC<MatchListProps> = ({ matches, groups, getParticipantName, onUpdateMatch, bestOf }) => {
  const [editingMatchId, setEditingMatchId] = React.useState<string | null>(null);
  
  const groupedMatches = matches.reduce((acc: Record<string, Match[]>, match: Match) => {
    const key = match.groupId || 'knockout';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const getGroupName = (groupId: string): string => {
    if (groupId === 'knockout' || !groups) return groupId;
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : groupId;
  };

  return (
    <div className="match-list">
      {Object.entries(groupedMatches).map(([groupKey, groupMatches]: [string, Match[]]) => {
        const groupName = getGroupName(groupKey);
        
        return (
          <div key={groupKey} className="match-group">
            {matches.some((m: Match) => m.groupId) && groupKey !== 'knockout' && (
              <h3>Gruppe {groupName}</h3>
            )}
            {(groupMatches as Match[]).map(match => {
              const isEditing = editingMatchId === match.id;
              const hasResult = match.winner !== null && match.score1 !== undefined && match.score2 !== undefined;
              
              const [score1, setScore1] = React.useState<string>(match.score1?.toString() || '0');
              const [score2, setScore2] = React.useState<string>(match.score2?.toString() || '0');
              
              // Sync state with match data when it changes
              React.useEffect(() => {
                setScore1(match.score1?.toString() || '0');
                setScore2(match.score2?.toString() || '0');
              }, [match.score1, match.score2]);
              
              // Auto-update match when scores change
              const handleScoreChange = (newScore1: string, newScore2: string) => {
                const s1 = parseInt(newScore1) || 0;
                const s2 = parseInt(newScore2) || 0;
                
                if (s1 >= 0 && s2 >= 0) {
                  // Calculate minimum legs needed to win
                  // For Best of X: need to win more than half, i.e., ceil(bestOf/2) legs
                  const legsToWin = Math.ceil(bestOf / 2);
                  
                  // Check if match is complete (someone has won enough legs)
                  // For group stage, allow draws when all legs have been played
                  const allLegsPlayed = s1 + s2 === bestOf;
                  const hasWinner = s1 >= legsToWin || s2 >= legsToWin;
                  
                  if (hasWinner) {
                    const winner = s1 > s2 ? match.player1! : match.player2!;
                    onUpdateMatch(match.id, winner, s1, s2);
                    setEditingMatchId(null);
                  } else if (match.groupId && allLegsPlayed) {
                    // Only for group matches: allow draw when all legs played
                    const winner = s1 > s2 ? match.player1! : s1 < s2 ? match.player2! : 'draw';
                    onUpdateMatch(match.id, winner, s1, s2);
                    setEditingMatchId(null);
                  } else {
                    // Match not complete yet, update scores without winner for live table
                    onUpdateMatch(match.id, '', s1, s2);
                  }
                }
              };
              
              const handleScore1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newScore1 = e.target.value;
                setScore1(newScore1);
                // Use current score2 state value
                handleScoreChange(newScore1, score2);
              };
              
              const handleScore2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newScore2 = e.target.value;
                setScore2(newScore2);
                // Use current score1 state value  
                handleScoreChange(score1, newScore2);
              };
              
              return (
                <div key={match.id} className={`match-item ${match.winner ? 'completed' : ''}`}>
                  {/* Compact match display format with inline inputs */}
                  <div className="match-display-inline">
                    <div className="match-display-line">
                      <span className={`player-name player1 ${match.winner === match.player1 ? 'winner' : ''}`}>
                        {getParticipantName(match.player1)}
                      </span>
                      {(!match.winner || isEditing) && match.player1 && match.player2 ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            max={bestOf}
                            className="score-input-field"
                            value={score1}
                            onChange={handleScore1Change}
                          />
                          <span className="score-separator">:</span>
                          <input
                            type="number"
                            min="0"
                            max={bestOf}
                            className="score-input-field"
                            value={score2}
                            onChange={handleScore2Change}
                          />
                        </>
                      ) : (
                        <span className="match-scores">
                          <span className="score-box">{match.score1 !== undefined ? match.score1 : '-'}</span>
                          <span className="score-separator">:</span>
                          <span className="score-box">{match.score2 !== undefined ? match.score2 : '-'}</span>
                        </span>
                      )}
                      <span className={`player-name player2 ${match.winner === match.player2 ? 'winner' : ''}`}>
                        {getParticipantName(match.player2)}
                      </span>
                    </div>
                  </div>
                  {hasResult && !isEditing && match.player1 && match.player2 && (
                    <button 
                      className="edit-result-button"
                      onClick={() => setEditingMatchId(match.id)}
                    >
                      Ändern
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default TournamentView;
