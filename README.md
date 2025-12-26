# 🎯 Darts Tournament PWA

Eine Progressive Web App zum Erstellen und Verwalten von Darts-Turnieren.

## Features

### Turniermodi
- **Nur Gruppenmodus**: Teilnehmer werden in Gruppen aufgeteilt (Standard: 4 pro Gruppe)
- **Nur KO-Modus**: Klassisches Knockout-Turnier mit automatischer Freilos-Berechnung
- **Kombinierter Modus**: Gruppenphase gefolgt von KO-Runde (wie bei der Fußball-WM)

### Intelligente Vorschläge
- Automatische Berechnung optimaler Gruppengrößen
- Freilose bei nicht-Zweierpotenzen (z.B. 10 Teilnehmer → 6 Freilose → 4 spielen in Runde 1)
- Anpassbare Einstellungen für Gruppenzahl und qualifizierte Teilnehmer

### PWA-Funktionen
- ✅ Installierbar auf Mobilgeräten und Desktop
- ✅ Offline-Unterstützung via Service Worker
- ✅ Responsives Design für alle Bildschirmgrößen
- ✅ Dark Mode mit automatischer Erkennung

### Design
- **Heller Modus**: Akzentfarbe #006655
- **Dunkler Modus**: Akzentfarbe #008866
- Persistente Theme-Auswahl (localStorage)

## Installation

### Lokal ausführen

1. Repository klonen:
```bash
git clone https://github.com/subbahenn/darts-pwa.git
cd darts-pwa
```

2. HTTP-Server starten (eine der folgenden Optionen):

**Mit Python:**
```bash
python3 -m http.server 8080
```

**Mit Node.js:**
```bash
npx http-server -p 8080
```

**Mit PHP:**
```bash
php -S localhost:8080
```

3. Browser öffnen: `http://localhost:8080`

### Als PWA installieren

1. Öffne die App in einem modernen Browser (Chrome, Edge, Safari)
2. Klicke auf das "Installieren"-Icon in der Adressleiste
3. Die App wird auf deinem Gerät installiert und kann offline verwendet werden

## Nutzung

1. **Anzahl der Teilnehmer** eingeben (2-128)
2. **Turniermodus** auswählen:
   - Nur Gruppenmodus
   - Nur KO-Modus
   - Gruppenphase + KO-Runde
3. Klick auf **"Turnier generieren"**
4. Vorschlag prüfen und optional **"Anpassen"**
5. **"Akzeptieren"** für die finale Turnierstruktur

### Freilose (Byes)

Wenn die Teilnehmerzahl in einer KO-Runde keine Zweierpotenz ist, werden automatisch Freilose vergeben:

- **10 Teilnehmer**: 6 Freilose (6 ziehen direkt weiter, 4 spielen → 8 in Runde 2)
- **12 Teilnehmer**: 4 Freilose (4 ziehen direkt weiter, 8 spielen → 8 in Runde 2)
- **16 Teilnehmer**: 0 Freilose (perfekte Zweierpotenz)

## Technologie-Stack

- **HTML5**: Semantische Struktur
- **CSS3**: Responsive Design mit CSS Custom Properties
- **Vanilla JavaScript**: Keine Frameworks, optimale Performance
- **Service Worker**: Offline-Funktionalität
- **Web App Manifest**: PWA-Installierbarkeit

## Browser-Unterstützung

- Chrome/Edge 90+
- Firefox 85+
- Safari 14+
- Opera 75+

## Lizenz

MIT

## Entwickelt von

subbahenn