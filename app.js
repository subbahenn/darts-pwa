// Tournament configuration
let tournamentConfig = {
    participants: 16,
    mode: 'group',
    groups: [],
    koRounds: [],
    groupCount: 0,
    groupSize: 0,
    koParticipants: 0
};

// DOM Elements
const setupSection = document.getElementById('setupSection');
const suggestionSection = document.getElementById('suggestionSection');
const customizeSection = document.getElementById('customizeSection');
const tournamentSection = document.getElementById('tournamentSection');

const participantCountInput = document.getElementById('participantCount');
const generateBtn = document.getElementById('generateBtn');
const customizeBtn = document.getElementById('customizeBtn');
const acceptBtn = document.getElementById('acceptBtn');
const backBtn = document.getElementById('backBtn');
const saveCustomBtn = document.getElementById('saveCustomBtn');
const cancelCustomBtn = document.getElementById('cancelCustomBtn');
const newTournamentBtn = document.getElementById('newTournamentBtn');
const themeToggle = document.getElementById('themeToggle');

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
    // Similar to World Cup: prefer 4 teams per group
    let groupSize = 4;
    let groupCount = Math.ceil(participants / groupSize);
    
    // Adjust if groups would be too uneven
    if (participants % groupSize === 1) {
        // Avoid having a group with just 1 member
        if (participants >= 6) {
            groupSize = 3;
            groupCount = Math.ceil(participants / groupSize);
        }
    }
    
    // For small numbers, adjust accordingly
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
    
    // Top 2 from each group advance to KO (like World Cup)
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

function createParticipants(count) {
    return Array.from({ length: count }, (_, i) => `Teilnehmer ${i + 1}`);
}

function distributeIntoGroups(participants, groupCount) {
    const groups = Array.from({ length: groupCount }, () => []);
    const shuffled = shuffleArray(participants);
    
    shuffled.forEach((participant, index) => {
        groups[index % groupCount].push(participant);
    });
    
    return groups;
}

function createKOBracket(participants) {
    const shuffled = shuffleArray(participants);
    const byes = calculateByes(participants.length);
    const rounds = [];
    
    // First round with byes
    const firstRound = [];
    const playersWithByes = shuffled.slice(0, byes);
    const playersInFirstRound = shuffled.slice(byes);
    
    // Create matches for first round
    for (let i = 0; i < playersInFirstRound.length; i += 2) {
        firstRound.push({
            player1: playersInFirstRound[i],
            player2: playersInFirstRound[i + 1] || null
        });
    }
    
    if (firstRound.length > 0) {
        rounds.push({
            name: byes > 0 ? '1. Runde (mit Freilosen)' : '1. Runde',
            matches: firstRound,
            byes: playersWithByes
        });
    }
    
    // Calculate remaining rounds
    const totalRounds = Math.ceil(Math.log2(participants.length));
    let nextRoundCount = Math.ceil((playersInFirstRound.length + byes) / 2);
    
    for (let i = 2; i <= totalRounds; i++) {
        const roundName = i === totalRounds ? 'Finale' : 
                         i === totalRounds - 1 ? 'Halbfinale' :
                         i === totalRounds - 2 ? 'Viertelfinale' :
                         `${i}. Runde`;
        
        rounds.push({
            name: roundName,
            matches: Array.from({ length: nextRoundCount }, () => ({
                player1: 'TBD',
                player2: 'TBD'
            })),
            byes: []
        });
        
        nextRoundCount = Math.floor(nextRoundCount / 2);
    }
    
    return rounds;
}

// Display functions
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
            <p style="margin-top: 15px; font-style: italic;">
                Jedes Team spielt gegen jedes andere Team in seiner Gruppe. Die Gruppen werden zufällig aufgeteilt.
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
        `;
    } else if (mode === 'combined') {
        html += `
            <label for="customGroupCount">Anzahl Gruppen:</label>
            <input type="number" id="customGroupCount" min="1" max="${tournamentConfig.participants}" value="${tournamentConfig.groupCount}">
            <br><br>
            <label for="customQualifiers">Qualifizierte pro Gruppe:</label>
            <input type="number" id="customQualifiers" min="1" max="4" value="2">
        `;
    }
    
    html += '</div>';
    return html;
}

function displayGroups(groups) {
    let html = '<div class="group-container">';
    
    groups.forEach((group, index) => {
        html += `
            <div class="group">
                <h3>Gruppe ${String.fromCharCode(65 + index)}</h3>
                <ul class="group-members">
                    ${group.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function displayBracket(rounds) {
    let html = '<div class="bracket">';
    
    rounds.forEach((round, index) => {
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
            html += `
                <div class="match ${isBye ? 'bye' : ''}">
                    <div class="match-player">${match.player1}</div>
                    <div class="match-vs">${isBye ? '(Freilos)' : 'vs'}</div>
                    <div class="match-player">${match.player2 || '-'}</div>
                </div>
            `;
        });
        html += '</div></div>';
    });
    
    html += '</div>';
    return html;
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
    
    let suggestion;
    let html = '';
    
    if (mode === 'group') {
        suggestion = generateGroupSuggestion(participants);
        tournamentConfig.groupCount = suggestion.groupCount;
        tournamentConfig.groupSize = suggestion.groupSize;
        html = displayGroupSuggestion(suggestion);
    } else if (mode === 'ko') {
        suggestion = generateKOSuggestion(participants);
        html = displayKOSuggestion(suggestion);
    } else if (mode === 'combined') {
        suggestion = generateCombinedSuggestion(participants);
        tournamentConfig.groupCount = suggestion.groupCount;
        tournamentConfig.groupSize = suggestion.groupSize;
        tournamentConfig.koParticipants = suggestion.koParticipants;
        html = displayCombinedSuggestion(suggestion);
    }
    
    document.getElementById('suggestionContent').innerHTML = html;
    
    setupSection.classList.add('hidden');
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
    const participants = createParticipants(tournamentConfig.participants);
    let html = '';
    
    if (tournamentConfig.mode === 'group') {
        tournamentConfig.groups = distributeIntoGroups(participants, tournamentConfig.groupCount);
        html = '<h3>Gruppenaufteilung</h3>' + displayGroups(tournamentConfig.groups);
    } else if (tournamentConfig.mode === 'ko') {
        tournamentConfig.koRounds = createKOBracket(participants);
        html = '<h3>KO-Turnierbaum</h3>' + displayBracket(tournamentConfig.koRounds);
    } else if (tournamentConfig.mode === 'combined') {
        tournamentConfig.groups = distributeIntoGroups(participants, tournamentConfig.groupCount);
        html = '<h3>Gruppenphase</h3>' + displayGroups(tournamentConfig.groups);
        
        // Create KO bracket with qualified participants
        const qualifiedParticipants = [];
        tournamentConfig.groups.forEach((group, index) => {
            const groupName = String.fromCharCode(65 + index);
            group.slice(0, 2).forEach((p, i) => {
                qualifiedParticipants.push(`${p} (${groupName}${i + 1})`);
            });
        });
        
        tournamentConfig.koRounds = createKOBracket(qualifiedParticipants);
        html += '<h3 style="margin-top: 30px;">KO-Phase</h3>' + displayBracket(tournamentConfig.koRounds);
    }
    
    document.getElementById('tournamentContent').innerHTML = html;
    
    suggestionSection.classList.add('hidden');
    tournamentSection.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    suggestionSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
});

newTournamentBtn.addEventListener('click', () => {
    tournamentSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    
    // Reset form
    participantCountInput.value = 16;
    document.querySelector('input[name="mode"][value="group"]').checked = true;
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
