// Tournament configuration
let tournamentConfig = {
    participants: 16,
    participantNames: [],
    mode: 'group',
    groups: [],
    koRounds: [],
    groupCount: 0,
    groupSize: 0,
    koParticipants: 0,
    gamesPerOpponent: 1,
    matches: [],
    standings: {}
};

// DOM Elements
const setupSection = document.getElementById('setupSection');
const participantNamesSection = document.getElementById('participantNamesSection');
const suggestionSection = document.getElementById('suggestionSection');
const customizeSection = document.getElementById('customizeSection');
const tournamentSection = document.getElementById('tournamentSection');

const participantCountInput = document.getElementById('participantCount');
const generateBtn = document.getElementById('generateBtn');
const confirmNamesBtn = document.getElementById('confirmNamesBtn');
const backToSetupBtn = document.getElementById('backToSetupBtn');
const customizeBtn = document.getElementById('customizeBtn');
const acceptBtn = document.getElementById('acceptBtn');
const backBtn = document.getElementById('backBtn');
const saveCustomBtn = document.getElementById('saveCustomBtn');
const cancelCustomBtn = document.getElementById('cancelCustomBtn');
const newTournamentBtn = document.getElementById('newTournamentBtn');
const themeToggle = document.getElementById('themeToggle');
const showScheduleBtn = document.getElementById('showScheduleBtn');
const showStandingsBtn = document.getElementById('showStandingsBtn');
const showBracketBtn = document.getElementById('showBracketBtn');

let currentView = 'schedule';

// Theme handling
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }
};

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// Tournament calculation functions
function nextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

function calculateByes(participants) {
    const nextPower = nextPowerOfTwo(participants);
    return nextPower - participants;
}

function generateGroupSuggestion(participants) {
    let groupSize = 4;
    let groupCount = Math.ceil(participants / groupSize);
    
    if (participants % groupSize === 1) {
        if (participants >= 6) {
            groupSize = 3;
            groupCount = Math.ceil(participants / groupSize);
        }
    }
    
    if (participants <= 8) {
        groupSize = participants <= 4 ? participants : 4;
        groupCount = Math.ceil(participants / groupSize);
    }
    
    return { groupCount, groupSize };
}

function generateKOSuggestion(participants) {
    const byes = calculateByes(participants);
    const rounds = Math.ceil(Math.log2(participants));
    
    return {
        participants,
        byes,
        rounds,
        firstRoundMatches: participants - byes
    };
}

function generateCombinedSuggestion(participants) {
    const groupSuggestion = generateGroupSuggestion(participants);
    const { groupCount, groupSize } = groupSuggestion;
    const koParticipants = groupCount * 2;
    const koSuggestion = generateKOSuggestion(koParticipants);
    
    return {
        groupCount,
        groupSize,
        koParticipants,
        ...koSuggestion
    };
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function distributeIntoGroups(participants, groupCount) {
    const groups = Array.from({ length: groupCount }, () => []);
    const shuffled = shuffleArray(participants);
    
    shuffled.forEach((participant, index) => {
        groups[index % groupCount].push(participant);
    });
    
    return groups;
}

// Generate matches for group phase
function generateGroupMatches(groups, gamesPerOpponent) {
    const matches = [];
    let matchId = 0;
    
    groups.forEach((group, groupIndex) => {
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                for (let game = 0; game < gamesPerOpponent; game++) {
                    matches.push({
                        id: matchId++,
                        group: groupIndex,
                        player1: group[i],
                        player2: group[j],
                        score1: null,
                        score2: null,
                        completed: false,
                        gameNumber: game + 1
                    });
                }
            }
        }
    });
    
    return matches;
}

// Calculate group standings
function calculateGroupStandings(matches, groups) {
    const standings = {};
    
    groups.forEach((group, groupIndex) => {
        standings[groupIndex] = group.map(player => ({
            player,
            played: 0,
            won: 0,
            lost: 0,
            points: 0,
            scoredLegs: 0,
            concededLegs: 0,
            legDifference: 0
        }));
        
        // Calculate from matches
        matches.filter(m => m.group === groupIndex && m.completed).forEach(match => {
            const p1Stats = standings[groupIndex].find(s => s.player === match.player1);
            const p2Stats = standings[groupIndex].find(s => s.player === match.player2);
            
            p1Stats.played++;
            p2Stats.played++;
            p1Stats.scoredLegs += match.score1;
            p1Stats.concededLegs += match.score2;
            p2Stats.scoredLegs += match.score2;
            p2Stats.concededLegs += match.score1;
            
            if (match.score1 > match.score2) {
                p1Stats.won++;
                p1Stats.points += 2;
                p2Stats.lost++;
            } else if (match.score2 > match.score1) {
                p2Stats.won++;
                p2Stats.points += 2;
                p1Stats.lost++;
            } else {
                p1Stats.points += 1;
                p2Stats.points += 1;
            }
        });
        
        // Calculate leg difference and sort
        standings[groupIndex].forEach(s => {
            s.legDifference = s.scoredLegs - s.concededLegs;
        });
        
        standings[groupIndex].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.legDifference !== a.legDifference) return b.legDifference - a.legDifference;
            return b.scoredLegs - a.scoredLegs;
        });
    });
    
    return standings;
}

// Create KO bracket
function createKOBracket(participants) {
    const shuffled = shuffleArray([...participants]);
    const byes = calculateByes(participants.length);
    const rounds = [];
    
    const playersWithByes = shuffled.slice(0, byes);
    const playersInFirstRound = shuffled.slice(byes);
    
    const firstRound = [];
    for (let i = 0; i < playersInFirstRound.length; i += 2) {
        firstRound.push({
            player1: playersInFirstRound[i],
            player2: playersInFirstRound[i + 1] || null,
            score1: null,
            score2: null,
            completed: false,
            winner: playersInFirstRound[i + 1] ? null : playersInFirstRound[i]
        });
    }
    
    if (firstRound.length > 0) {
        rounds.push({
            name: byes > 0 ? '1. Runde (mit Freilosen)' : '1. Runde',
            matches: firstRound,
            byes: playersWithByes
        });
    }
    
    const totalRounds = Math.ceil(Math.log2(participants.length));
    let nextRoundCount = Math.ceil((playersInFirstRound.length + byes) / 2);
    
    for (let i = 2; i <= totalRounds; i++) {
        const roundName = i === totalRounds ? 'Finale' : 
                         i === totalRounds - 1 ? 'Halbfinale' :
                         i === totalRounds - 2 ? 'Viertelfinale' :
                         `${i}. Runde`;
        
        const matches = [];
        for (let j = 0; j < nextRoundCount; j++) {
            matches.push({
                player1: 'TBD',
                player2: 'TBD',
                score1: null,
                score2: null,
                completed: false,
                winner: null
            });
        }
        
        rounds.push({
            name: roundName,
            matches,
            byes: []
        });
        
        nextRoundCount = Math.floor(nextRoundCount / 2);
    }
    
    // If there are byes, add them to second round
    if (byes > 0 && rounds.length > 1) {
        playersWithByes.forEach((player, index) => {
            if (index < rounds[1].matches.length) {
                rounds[1].matches[index].player1 = player;
            }
        });
    }
    
    return rounds;
}

// Display functions
function displayParticipantNames(count) {
    let html = '<p>Geben Sie die Namen der Teilnehmer ein:</p>';
    
    for (let i = 0; i < count; i++) {
        const savedName = tournamentConfig.participantNames[i] || `Teilnehmer ${i + 1}`;
        html += `
            <div class="participant-name-input">
                <label for="name${i}">Teilnehmer ${i + 1}:</label>
                <input type="text" id="name${i}" value="${savedName}" required>
            </div>
        `;
    }
    
    document.getElementById('participantNamesContent').innerHTML = html;
}

function displayGroupSuggestion(config) {
    const { groupCount, groupSize } = config;
    const participants = tournamentConfig.participants;
    
    return `
        <div class="suggestion-box">
            <h3>Gruppenmodus Vorschlag</h3>
            <div class="info-item">
                <strong>Teilnehmer:</strong> ${participants}
            </div>
            <div class="info-item">
                <strong>Anzahl Gruppen:</strong> ${groupCount}
            </div>
            <div class="info-item">
                <strong>Spieler pro Gruppe:</strong> ~${groupSize}
            </div>
            <div class="info-item">
                <strong>Spiele gegen jeden Gegner:</strong> ${tournamentConfig.gamesPerOpponent}
            </div>
            <p style="margin-top: 15px; font-style: italic;">
                Jedes Team spielt ${tournamentConfig.gamesPerOpponent === 1 ? 'einmal' : tournamentConfig.gamesPerOpponent + ' mal'} gegen jedes andere Team in seiner Gruppe.
            </p>
        </div>
    `;
}

function displayKOSuggestion(config) {
    const { participants, byes, rounds, firstRoundMatches } = config;
    
    return `
        <div class="suggestion-box">
            <h3>KO-Modus Vorschlag</h3>
            <div class="info-item">
                <strong>Teilnehmer:</strong> ${participants}
            </div>
            <div class="info-item">
                <strong>Freilose:</strong> ${byes} ${byes > 0 ? '(ziehen direkt in die nächste Runde ein)' : '(keine benötigt)'}
            </div>
            <div class="info-item">
                <strong>Runden:</strong> ${rounds}
            </div>
            <div class="info-item">
                <strong>Spiele in 1. Runde:</strong> ${firstRoundMatches / 2}
            </div>
            <p style="margin-top: 15px; font-style: italic;">
                ${byes > 0 ? `${byes} zufällig gewählte Teilnehmer erhalten Freilose und ziehen direkt in die nächste Runde ein.` : 'Alle Teilnehmer spielen in der ersten Runde.'}
            </p>
        </div>
    `;
}

function displayCombinedSuggestion(config) {
    const { groupCount, groupSize, koParticipants, byes, rounds } = config;
    const participants = tournamentConfig.participants;
    
    return `
        <div class="suggestion-box">
            <h3>Kombinierter Modus Vorschlag</h3>
            <h4>Gruppenphase:</h4>
            <div class="info-item">
                <strong>Teilnehmer:</strong> ${participants}
            </div>
            <div class="info-item">
                <strong>Anzahl Gruppen:</strong> ${groupCount}
            </div>
            <div class="info-item">
                <strong>Spieler pro Gruppe:</strong> ~${groupSize}
            </div>
            <div class="info-item">
                <strong>Spiele gegen jeden Gegner:</strong> ${tournamentConfig.gamesPerOpponent}
            </div>
            
            <h4 style="margin-top: 20px;">KO-Phase:</h4>
            <div class="info-item">
                <strong>Qualifizierte Teilnehmer:</strong> ${koParticipants} (Top 2 pro Gruppe)
            </div>
            <div class="info-item">
                <strong>Freilose in KO-Phase:</strong> ${byes} ${byes > 0 ? '(falls benötigt)' : ''}
            </div>
            <div class="info-item">
                <strong>KO-Runden:</strong> ${rounds}
            </div>
            <p style="margin-top: 15px; font-style: italic;">
                Nach der Gruppenphase qualifizieren sich die Top 2 jeder Gruppe für die KO-Phase.
            </p>
        </div>
    `;
}

function displayCustomizeForm(mode) {
    let html = '<div class="customize-input">';
    
    if (mode === 'group') {
        html += `
            <label for="customGroupCount">Anzahl Gruppen:</label>
            <input type="number" id="customGroupCount" min="1" max="${tournamentConfig.participants}" value="${tournamentConfig.groupCount}">
            <br><br>
            <label for="customGamesPerOpponent">Spiele gegen jeden Gegner:</label>
            <input type="number" id="customGamesPerOpponent" min="1" max="5" value="${tournamentConfig.gamesPerOpponent}">
        `;
    } else if (mode === 'combined') {
        html += `
            <label for="customGroupCount">Anzahl Gruppen:</label>
            <input type="number" id="customGroupCount" min="1" max="${tournamentConfig.participants}" value="${tournamentConfig.groupCount}">
            <br><br>
            <label for="customQualifiers">Qualifizierte pro Gruppe:</label>
            <input type="number" id="customQualifiers" min="1" max="4" value="2">
            <br><br>
            <label for="customGamesPerOpponent">Spiele gegen jeden Gegner:</label>
            <input type="number" id="customGamesPerOpponent" min="1" max="5" value="${tournamentConfig.gamesPerOpponent}">
        `;
    }
    
    html += '</div>';
    return html;
}

function displaySchedule() {
    let html = '<div class="schedule-container">';
    
    if (tournamentConfig.mode === 'group' || tournamentConfig.mode === 'combined') {
        html += '<h3>Gruppenphase Spielplan</h3>';
        
        tournamentConfig.groups.forEach((group, groupIndex) => {
            const groupName = String.fromCharCode(65 + groupIndex);
            const groupMatches = tournamentConfig.matches.filter(m => m.group === groupIndex);
            
            if (groupMatches.length > 0) {
                html += `<div class="round-matches">
                    <h4>Gruppe ${groupName}</h4>`;
                
                groupMatches.forEach(match => {
                    const gameLabel = tournamentConfig.gamesPerOpponent > 1 ? ` (Spiel ${match.gameNumber})` : '';
                    html += `
                        <div class="match-result ${match.completed ? 'completed' : ''}" data-match-id="${match.id}">
                            <div class="player-name">${match.player1}</div>
                            <input type="number" class="score-input" min="0" max="99" 
                                   value="${match.score1 !== null ? match.score1 : ''}" 
                                   placeholder="0"
                                   onchange="updateMatchScore(${match.id}, 1, this.value)">
                            <div class="match-vs">:</div>
                            <input type="number" class="score-input" min="0" max="99" 
                                   value="${match.score2 !== null ? match.score2 : ''}" 
                                   placeholder="0"
                                   onchange="updateMatchScore(${match.id}, 2, this.value)">
                            <div class="player-name">${match.player2}</div>
                            <span style="margin-left: 10px; color: var(--text-color); opacity: 0.7;">${gameLabel}</span>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
        });
    }
    
    if (tournamentConfig.mode === 'ko' || (tournamentConfig.mode === 'combined' && tournamentConfig.koRounds.length > 0)) {
        if (tournamentConfig.mode === 'combined') {
            html += '<h3 style="margin-top: 30px;">KO-Phase Spielplan</h3>';
        }
        
        tournamentConfig.koRounds.forEach((round, roundIndex) => {
            html += `<div class="round-matches">
                <h4>${round.name}</h4>`;
            
            if (round.byes && round.byes.length > 0) {
                html += `<div style="margin-bottom: 15px; padding: 10px; background: var(--card-bg); border-radius: 8px;">
                    <strong>Freilose:</strong> ${round.byes.join(', ')}
                </div>`;
            }
            
            round.matches.forEach((match, matchIndex) => {
                const isBye = !match.player2;
                const matchId = `ko-${roundIndex}-${matchIndex}`;
                
                if (match.player1 !== 'TBD' && match.player2 !== 'TBD') {
                    html += `
                        <div class="match-result ${match.completed ? 'completed' : ''}" data-match-id="${matchId}">
                            <div class="player-name">${match.player1}</div>
                            ${!isBye ? `
                                <input type="number" class="score-input" min="0" max="99" 
                                       value="${match.score1 !== null ? match.score1 : ''}" 
                                       placeholder="0"
                                       onchange="updateKOMatchScore(${roundIndex}, ${matchIndex}, 1, this.value)">
                                <div class="match-vs">:</div>
                                <input type="number" class="score-input" min="0" max="99" 
                                       value="${match.score2 !== null ? match.score2 : ''}" 
                                       placeholder="0"
                                       onchange="updateKOMatchScore(${roundIndex}, ${matchIndex}, 2, this.value)">
                                <div class="player-name">${match.player2}</div>
                            ` : '<div class="match-vs">(Freilos)</div><div class="player-name">-</div>'}
                        </div>
                    `;
                } else {
                    html += `
                        <div class="match-result">
                            <div class="player-name">${match.player1}</div>
                            <div class="match-vs">vs</div>
                            <div class="player-name">${match.player2}</div>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
        });
    }
    
    html += '</div>';
    return html;
}

function displayStandings() {
    let html = '<div class="standings-container">';
    
    if (tournamentConfig.mode === 'group' || tournamentConfig.mode === 'combined') {
        html += '<h3>Gruppentabellen</h3>';
        
        const standings = calculateGroupStandings(tournamentConfig.matches, tournamentConfig.groups);
        
        tournamentConfig.groups.forEach((group, groupIndex) => {
            const groupName = String.fromCharCode(65 + groupIndex);
            html += `
                <div class="group" style="margin-bottom: 20px;">
                    <h4>Gruppe ${groupName}</h4>
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th>Pl.</th>
                                <th>Team</th>
                                <th>Sp.</th>
                                <th>S</th>
                                <th>N</th>
                                <th>Legs</th>
                                <th>Diff</th>
                                <th>Pkt</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            standings[groupIndex].forEach((stat, index) => {
                const isQualified = tournamentConfig.mode === 'combined' && index < 2;
                html += `
                    <tr class="${isQualified ? 'qualified' : ''}">
                        <td>${index + 1}</td>
                        <td><strong>${stat.player}</strong></td>
                        <td>${stat.played}</td>
                        <td>${stat.won}</td>
                        <td>${stat.lost}</td>
                        <td>${stat.scoredLegs}:${stat.concededLegs}</td>
                        <td>${stat.legDifference > 0 ? '+' : ''}${stat.legDifference}</td>
                        <td><strong>${stat.points}</strong></td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        if (tournamentConfig.mode === 'combined') {
            html += '<p style="margin-top: 10px;"><em>Die Top 2 jeder Gruppe (grün markiert) qualifizieren sich für die KO-Phase.</em></p>';
        }
    }
    
    html += '</div>';
    return html;
}

function displayBracket() {
    let html = '<div class="bracket">';
    
    tournamentConfig.koRounds.forEach((round, roundIndex) => {
        html += `<div class="bracket-round">
            <h3>${round.name}</h3>`;
        
        if (round.byes && round.byes.length > 0) {
            html += `<div style="margin-bottom: 15px; padding: 10px; background: var(--card-bg); border-radius: 8px;">
                <strong>Freilose:</strong> ${round.byes.join(', ')}
            </div>`;
        }
        
        html += '<div class="bracket-matches">';
        round.matches.forEach((match, matchIndex) => {
            const isBye = !match.player2;
            let displayP1 = match.player1;
            let displayP2 = match.player2 || '-';
            
            if (match.winner) {
                displayP1 = match.player1;
                displayP2 = match.player2;
                if (match.score1 !== null && match.score2 !== null) {
                    displayP1 += ` (${match.score1})`;
                    displayP2 += ` (${match.score2})`;
                }
            }
            
            html += `
                <div class="match ${isBye ? 'bye' : ''} ${match.completed ? 'completed' : ''}">
                    <div class="match-player">${displayP1}</div>
                    <div class="match-vs">${isBye ? '(Freilos)' : 'vs'}</div>
                    <div class="match-player">${displayP2}</div>
                </div>
            `;
        });
        html += '</div></div>';
    });
    
    html += '</div>';
    return html;
}

// Update match scores
window.updateMatchScore = function(matchId, player, value) {
    const match = tournamentConfig.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const score = value === '' ? null : parseInt(value);
    
    if (player === 1) {
        match.score1 = score;
    } else {
        match.score2 = score;
    }
    
    if (match.score1 !== null && match.score2 !== null) {
        match.completed = true;
    } else {
        match.completed = false;
    }
    
    // Refresh current view
    refreshTournamentView();
};

window.updateKOMatchScore = function(roundIndex, matchIndex, player, value) {
    const match = tournamentConfig.koRounds[roundIndex].matches[matchIndex];
    if (!match) return;
    
    const score = value === '' ? null : parseInt(value);
    
    if (player === 1) {
        match.score1 = score;
    } else {
        match.score2 = score;
    }
    
    if (match.score1 !== null && match.score2 !== null) {
        match.completed = true;
        
        // Determine winner
        if (match.score1 > match.score2) {
            match.winner = match.player1;
        } else if (match.score2 > match.score1) {
            match.winner = match.player2;
        } else {
            match.winner = null; // Draw - shouldn't happen in KO
        }
        
        // Advance winner to next round
        if (match.winner && roundIndex < tournamentConfig.koRounds.length - 1) {
            const nextRound = tournamentConfig.koRounds[roundIndex + 1];
            const nextMatchIndex = Math.floor(matchIndex / 2);
            
            if (matchIndex % 2 === 0) {
                nextRound.matches[nextMatchIndex].player1 = match.winner;
            } else {
                nextRound.matches[nextMatchIndex].player2 = match.winner;
            }
        }
    } else {
        match.completed = false;
        match.winner = null;
    }
    
    refreshTournamentView();
};

function refreshTournamentView() {
    if (currentView === 'schedule') {
        document.getElementById('tournamentContent').innerHTML = displaySchedule();
    } else if (currentView === 'standings') {
        document.getElementById('tournamentContent').innerHTML = displayStandings();
    } else if (currentView === 'bracket') {
        document.getElementById('tournamentContent').innerHTML = displayBracket();
    }
}

// Event handlers
generateBtn.addEventListener('click', () => {
    const participants = parseInt(participantCountInput.value);
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    if (participants < 2) {
        alert('Bitte mindestens 2 Teilnehmer eingeben.');
        return;
    }
    
    tournamentConfig.participants = participants;
    tournamentConfig.mode = mode;
    tournamentConfig.participantNames = [];
    
    displayParticipantNames(participants);
    
    setupSection.classList.add('hidden');
    participantNamesSection.classList.remove('hidden');
});

backToSetupBtn.addEventListener('click', () => {
    participantNamesSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
});

confirmNamesBtn.addEventListener('click', () => {
    // Collect participant names
    tournamentConfig.participantNames = [];
    for (let i = 0; i < tournamentConfig.participants; i++) {
        const nameInput = document.getElementById(`name${i}`);
        tournamentConfig.participantNames.push(nameInput.value || `Teilnehmer ${i + 1}`);
    }
    
    let suggestion;
    let html = '';
    
    if (tournamentConfig.mode === 'group') {
        suggestion = generateGroupSuggestion(tournamentConfig.participants);
        tournamentConfig.groupCount = suggestion.groupCount;
        tournamentConfig.groupSize = suggestion.groupSize;
        html = displayGroupSuggestion(suggestion);
    } else if (tournamentConfig.mode === 'ko') {
        suggestion = generateKOSuggestion(tournamentConfig.participants);
        html = displayKOSuggestion(suggestion);
    } else if (tournamentConfig.mode === 'combined') {
        suggestion = generateCombinedSuggestion(tournamentConfig.participants);
        tournamentConfig.groupCount = suggestion.groupCount;
        tournamentConfig.groupSize = suggestion.groupSize;
        tournamentConfig.koParticipants = suggestion.koParticipants;
        html = displayCombinedSuggestion(suggestion);
    }
    
    document.getElementById('suggestionContent').innerHTML = html;
    
    participantNamesSection.classList.add('hidden');
    suggestionSection.classList.remove('hidden');
});

customizeBtn.addEventListener('click', () => {
    const html = displayCustomizeForm(tournamentConfig.mode);
    document.getElementById('customizeContent').innerHTML = html;
    
    suggestionSection.classList.add('hidden');
    customizeSection.classList.remove('hidden');
});

saveCustomBtn.addEventListener('click', () => {
    const mode = tournamentConfig.mode;
    
    if (mode === 'group' || mode === 'combined') {
        const customGroupCount = parseInt(document.getElementById('customGroupCount').value);
        tournamentConfig.groupCount = customGroupCount;
        
        const customGamesPerOpponent = parseInt(document.getElementById('customGamesPerOpponent').value);
        tournamentConfig.gamesPerOpponent = customGamesPerOpponent;
    }
    
    if (mode === 'combined') {
        const customQualifiers = parseInt(document.getElementById('customQualifiers').value) || 2;
        tournamentConfig.koParticipants = tournamentConfig.groupCount * customQualifiers;
    }
    
    customizeSection.classList.add('hidden');
    suggestionSection.classList.remove('hidden');
    
    // Update suggestion display
    let suggestion;
    let html = '';
    
    if (mode === 'group') {
        suggestion = {
            groupCount: tournamentConfig.groupCount,
            groupSize: Math.ceil(tournamentConfig.participants / tournamentConfig.groupCount)
        };
        html = displayGroupSuggestion(suggestion);
    } else if (mode === 'combined') {
        const koSuggestion = generateKOSuggestion(tournamentConfig.koParticipants);
        suggestion = {
            groupCount: tournamentConfig.groupCount,
            groupSize: Math.ceil(tournamentConfig.participants / tournamentConfig.groupCount),
            koParticipants: tournamentConfig.koParticipants,
            ...koSuggestion
        };
        html = displayCombinedSuggestion(suggestion);
    }
    
    document.getElementById('suggestionContent').innerHTML = html;
});

cancelCustomBtn.addEventListener('click', () => {
    customizeSection.classList.add('hidden');
    suggestionSection.classList.remove('hidden');
});

acceptBtn.addEventListener('click', () => {
    tournamentConfig.matches = [];
    tournamentConfig.groups = [];
    tournamentConfig.koRounds = [];
    
    if (tournamentConfig.mode === 'group' || tournamentConfig.mode === 'combined') {
        tournamentConfig.groups = distributeIntoGroups(tournamentConfig.participantNames, tournamentConfig.groupCount);
        tournamentConfig.matches = generateGroupMatches(tournamentConfig.groups, tournamentConfig.gamesPerOpponent);
    }
    
    if (tournamentConfig.mode === 'ko') {
        tournamentConfig.koRounds = createKOBracket(tournamentConfig.participantNames);
    } else if (tournamentConfig.mode === 'combined') {
        // KO rounds will be created after group phase completion
        // For now, create empty structure
        const qualifiedParticipants = [];
        tournamentConfig.groups.forEach((group, index) => {
            const groupName = String.fromCharCode(65 + index);
            group.slice(0, 2).forEach((p, i) => {
                qualifiedParticipants.push(`${p} (${groupName}${i + 1})`);
            });
        });
        tournamentConfig.koRounds = createKOBracket(qualifiedParticipants);
    }
    
    // Show tournament nav
    document.getElementById('tournamentNav').classList.remove('hidden');
    
    if (tournamentConfig.mode === 'group') {
        showScheduleBtn.classList.add('active');
        showStandingsBtn.classList.remove('active');
        showBracketBtn.classList.add('hidden');
        currentView = 'schedule';
    } else if (tournamentConfig.mode === 'ko') {
        showScheduleBtn.classList.add('active');
        showStandingsBtn.classList.add('hidden');
        showBracketBtn.classList.remove('hidden');
        showBracketBtn.classList.remove('active');
        currentView = 'schedule';
    } else {
        showScheduleBtn.classList.add('active');
        showStandingsBtn.classList.remove('active');
        showBracketBtn.classList.remove('hidden');
        showBracketBtn.classList.remove('active');
        currentView = 'schedule';
    }
    
    refreshTournamentView();
    
    suggestionSection.classList.add('hidden');
    tournamentSection.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    suggestionSection.classList.add('hidden');
    participantNamesSection.classList.remove('hidden');
});

newTournamentBtn.addEventListener('click', () => {
    tournamentSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    document.getElementById('tournamentNav').classList.add('hidden');
    
    // Reset form
    participantCountInput.value = 16;
    document.querySelector('input[name="mode"][value="group"]').checked = true;
    tournamentConfig = {
        participants: 16,
        participantNames: [],
        mode: 'group',
        groups: [],
        koRounds: [],
        groupCount: 0,
        groupSize: 0,
        koParticipants: 0,
        gamesPerOpponent: 1,
        matches: [],
        standings: {}
    };
});

showScheduleBtn.addEventListener('click', () => {
    currentView = 'schedule';
    showScheduleBtn.classList.add('active');
    showStandingsBtn.classList.remove('active');
    showBracketBtn.classList.remove('active');
    refreshTournamentView();
});

showStandingsBtn.addEventListener('click', () => {
    currentView = 'standings';
    showScheduleBtn.classList.remove('active');
    showStandingsBtn.classList.add('active');
    showBracketBtn.classList.remove('active');
    refreshTournamentView();
});

showBracketBtn.addEventListener('click', () => {
    currentView = 'bracket';
    showScheduleBtn.classList.remove('active');
    showStandingsBtn.classList.remove('active');
    showBracketBtn.classList.add('active');
    refreshTournamentView();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

// Initialize
initTheme();
