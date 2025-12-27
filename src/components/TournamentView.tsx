import React from 'react';
import type { Match, Participant, GroupStanding, Tournament, Group } from '../types';
import './TournamentView.css';

interface TournamentViewProps {
  tournament: Tournament;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ tournament, onUpdateMatch }) => {
  const [currentView, setCurrentView] = React.useState<'overview' | 'table' | 'bracket'>('overview');

  const getParticipantName = (id: string | null): string => {
    if (!id) return 'TBD';
    const participant = tournament.config.participants.find((p: Participant) => p.id === id);
    return participant?.name || 'TBD';
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
        points: 0
      }));

      // Calculate standings from matches
      tournament.matches
        .filter((m: Match) => m.groupId === group.id && m.winner)
        .forEach((match: Match) => {
          const p1Standing = standings.find(s => s.participantId === match.player1);
          const p2Standing = standings.find(s => s.participantId === match.player2);

          if (p1Standing) p1Standing.played++;
          if (p2Standing) p2Standing.played++;

          if (match.winner === match.player1 && p1Standing) {
            p1Standing.won++;
            p1Standing.points += 3;
            if (p2Standing) p2Standing.lost++;
          } else if (match.winner === match.player2 && p2Standing) {
            p2Standing.won++;
            p2Standing.points += 3;
            if (p1Standing) p1Standing.lost++;
          }
        });

      // Sort by points, then wins
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.won !== a.won) return b.won - a.won;
        return a.participantName.localeCompare(b.participantName);
      });

      standingsMap.set(group.id, standings);
    });

    return standingsMap;
  };

  const groupStandings = calculateGroupStandings();

  return (
    <div className="tournament-view">
      <header className="tournament-header">
        <h1>🎯 Darts Turnier</h1>
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
                  <th>Siege</th>
                  <th>Niederlagen</th>
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
                    <td>{standing.lost}</td>
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
  if (!tournament.knockoutBracket) {
    return <div className="card">Kein Turnierbaum verfügbar</div>;
  }

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
              {round.map((match: Match) => (
                <div key={match.id} className="bracket-match card">
                  <div className={`bracket-player ${match.winner === match.player1 ? 'winner' : ''}`}>
                    <span>{getParticipantName(match.player1)}</span>
                    {match.score1 !== undefined && <span className="score">{match.score1}</span>}
                  </div>
                  <div className={`bracket-player ${match.winner === match.player2 ? 'winner' : ''}`}>
                    <span>{getParticipantName(match.player2)}</span>
                    {match.score2 !== undefined && <span className="score">{match.score2}</span>}
                  </div>
                  {match.player1 && match.player2 && !match.winner && (
                    <div className="match-actions">
                      <button onClick={() => onUpdateMatch(match.id, match.player1!, 1, 0)}>
                        {getParticipantName(match.player1).split(' ')[0]} gewinnt
                      </button>
                      <button onClick={() => onUpdateMatch(match.id, match.player2!, 0, 1)}>
                        {getParticipantName(match.player2).split(' ')[0]} gewinnt
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
  getParticipantName: (id: string | null) => string;
  onUpdateMatch: (matchId: string, winner: string, score1?: number, score2?: number) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, getParticipantName, onUpdateMatch }) => {
  const groupedMatches = matches.reduce((acc: Record<string, Match[]>, match: Match) => {
    const key = match.groupId || 'knockout';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <div className="match-list">
      {Object.entries(groupedMatches).map(([groupKey, groupMatches]: [string, Match[]]) => (
        <div key={groupKey} className="match-group">
          {matches.some((m: Match) => m.groupId) && groupKey !== 'knockout' && (
            <h3>Gruppe {groupKey}</h3>
          )}
          {(groupMatches as Match[]).map(match => (
            <div key={match.id} className={`match-item ${match.winner ? 'completed' : ''}`}>
              <div className="match-players">
                <span className={match.winner === match.player1 ? 'winner' : ''}>
                  {getParticipantName(match.player1)}
                </span>
                <span className="vs">vs</span>
                <span className={match.winner === match.player2 ? 'winner' : ''}>
                  {getParticipantName(match.player2)}
                </span>
              </div>
              {!match.winner && match.player1 && match.player2 && (
                <div className="match-actions">
                  <button onClick={() => onUpdateMatch(match.id, match.player1!, 1, 0)}>
                    {getParticipantName(match.player1).split(' ')[0]}
                  </button>
                  <button onClick={() => onUpdateMatch(match.id, match.player2!, 0, 1)}>
                    {getParticipantName(match.player2).split(' ')[0]}
                  </button>
                </div>
              )}
              {match.winner && (
                <div className="match-result">
                  ✓ Gewinner: {getParticipantName(match.winner)}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TournamentView;
