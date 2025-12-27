# Darts Tournament PWA

Eine moderne Progressive Web App (PWA) zur Verwaltung von Darts-Turnieren.

## Features

- 🎯 **Drei Turniermodi:**
  - Nur Gruppenmodus
  - Nur KO-Modus  
  - Gruppe + KO (wie bei der Fußball-WM)

- 👥 **Teilnehmerverwaltung:**
  - Beliebige Anzahl von Teilnehmern
  - Speicherung von Teilnehmernamen für zukünftige Turniere
  - Autocomplete-Funktion für gespeicherte Namen

- 📊 **Gruppenphase:**
  - Flexible Gruppenanzahl mit intelligenten Vorschlägen
  - Konfigurierbare Anzahl der Spiele pro Gegner (1 oder 2)
  - Tabelle mit Punkten, Siegen und Niederlagen
  - Qualifikation der Top 2 pro Gruppe für KO-Phase

- 🏆 **KO-Phase:**
  - Visueller Turnierbaum
  - Automatische Freilose bei nicht-Zweierpotenzen
  - Live-Aktualisierung der Paarungen

- 📱 **PWA-Funktionen:**
  - Offline-fähig
  - Installierbar auf allen Geräten
  - Responsive Design

- 🎨 **Modernes Design:**
  - Heller Modus: Akzentfarbe #006655
  - Dunkler Modus: Akzentfarbe #008866
  - Automatische Anpassung an System-Theme

## Technologie

- React 19
- TypeScript
- Vite
- PWA Plugin

## Setup und Installation

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm (wird mit Node.js installiert)

### Installation

**WICHTIG:** Vor der ersten Verwendung müssen die Abhängigkeiten installiert werden:

```bash
npm install
```

Dieser Schritt ist zwingend erforderlich und muss nur einmal nach dem Klonen des Repositories ausgeführt werden.

## Verwendung

### Entwicklungsmodus starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5173` verfügbar.

### Produktions-Build erstellen

```bash
npm run build
```

Die optimierten Dateien werden im `dist/` Ordner erstellt.

### Produktions-Build lokal testen

```bash
npm run preview
```

Damit können Sie den Produktions-Build lokal testen, bevor Sie ihn deployen.

## Troubleshooting

### Die App lädt nicht

Falls die App nach `npm run dev`, `npm run build` oder `npm run preview` nicht lädt:

1. Stellen Sie sicher, dass Sie `npm install` ausgeführt haben
2. Löschen Sie `node_modules` und führen Sie `npm install` erneut aus:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Löschen Sie den Cache und bauen Sie neu:
   ```bash
   rm -rf node_modules dist .vite
   npm install
   npm run build
   ```

### TypeScript-Fehler

Falls TypeScript-Fehler auftreten, stellen Sie sicher, dass alle Type-Definition-Pakete installiert sind:

```bash
npm install --save-dev @types/node
```


