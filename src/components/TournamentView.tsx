import React from 'react';
import type { Match, Participant, GroupStanding, Tournament, Group } from '../types';
import ScoreInput from './ScoreInput';
import './TournamentView.css';

interface TournamentViewProps {
  tournament: Tournament;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
  onSaveTournament?: () => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ tournament, onUpdateMatch, onSaveTournament }) => {
  const [currentView, setCurrentView] = React.useState<'overview' | 'table' | 'bracket'>('overview');

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
        // Only show winner if all matches are complete
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
        .filter((m: Match) => m.groupId === group.id && m.winner && m.score1 !== undefined && m.score2 !== undefined)
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

      {winner && (
        <div className="winner-announcement">
          <div className="winner-content">
            <div className="winner-trophy">🏆</div>
            <div className="winner-title">Turniersieger</div>
            <div className="winner-name">{winner.name}</div>
            <div className="winner-confetti">🎉</div>
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
  return (
    <div className="overview-view">
      {/* Top 4 compact table */}
      {groupStandings.size > 0 && (
        <div className="top-standings card">
          <h2>Top 4</h2>
          <table className="compact-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Spieler</th>
                <th>P</th>
                <th>S</th>
                <th>Pkt</th>
              </tr>
            </thead>
            <tbody>
              {(Array.from(groupStandings.values())
                .flat() as GroupStanding[])
                .sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  if (b.won !== a.won) return b.won - a.won;
                  return 0;
                })
                .slice(0, 4)
                .map((standing, index) => (
                  <tr key={standing.participantId}>
                    <td>{index + 1}</td>
                    <td>{standing.participantName}</td>
                    <td>{standing.played}</td>
                    <td>{standing.won}</td>
                    <td><strong>{standing.points}</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Match schedule */}
      <div className="matches-section card">
        <h2>Spielplan</h2>
        <MatchList
          matches={tournament.matches}
          groups={tournament.groups}
          getParticipantName={getParticipantName}
          onUpdateMatch={onUpdateMatch}
        />
      </div>
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
}

const BracketView: React.FC<BracketViewProps> = ({ tournament, getParticipantName, onUpdateMatch }) => {
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
                
                return (
                  <div key={currentMatch.id} className="bracket-match card">
                    <div className={`bracket-player ${currentMatch.winner === currentMatch.player1 ? 'winner' : ''}`}>
                      <span>{getParticipantName(currentMatch.player1)}</span>
                      {currentMatch.score1 !== undefined && <span className="score">{currentMatch.score1}</span>}
                    </div>
                    <div className={`bracket-player ${currentMatch.winner === currentMatch.player2 ? 'winner' : ''}`}>
                      <span>{getParticipantName(currentMatch.player2)}</span>
                      {currentMatch.score2 !== undefined && <span className="score">{currentMatch.score2}</span>}
                    </div>
                    {currentMatch.player1 && currentMatch.player2 && (!currentMatch.winner || isEditing) && (
                      <ScoreInput
                        player1Name={getParticipantName(currentMatch.player1)}
                        player2Name={getParticipantName(currentMatch.player2)}
                        onSubmit={(score1, score2) => {
                          const winner = score1 > score2 ? currentMatch.player1! : score1 < score2 ? currentMatch.player2! : null;
                          onUpdateMatch(currentMatch.id, winner!, score1, score2);
                          setEditingMatchId(null);
                        }}
                      />
                    )}
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
}

const MatchList: React.FC<MatchListProps> = ({ matches, groups, getParticipantName, onUpdateMatch }) => {
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
              
              return (
                <div key={match.id} className={`match-item ${match.winner ? 'completed' : ''}`}>
                  <div className="match-players">
                    <span className={match.winner === match.player1 ? 'winner' : ''}>
                      {getParticipantName(match.player1)}
                    </span>
                    {match.score1 !== undefined && match.score2 !== undefined && (
                      <span className="match-score">{match.score1}:{match.score2}</span>
                    )}
                    {match.score1 === undefined && <span className="vs">vs</span>}
                    <span className={match.winner === match.player2 ? 'winner' : ''}>
                      {getParticipantName(match.player2)}
                    </span>
                  </div>
                  {(!match.winner || isEditing) && match.player1 && match.player2 && (
                    <ScoreInput
                      player1Name={getParticipantName(match.player1)}
                      player2Name={getParticipantName(match.player2)}
                      onSubmit={(score1, score2) => {
                        // Allow draws: if scores are equal, winner is 'draw'
                        const winner = score1 > score2 ? match.player1! : score1 < score2 ? match.player2! : 'draw';
                        onUpdateMatch(match.id, winner, score1, score2);
                        setEditingMatchId(null);
                      }}
                    />
                  )}
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
