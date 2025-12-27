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

**Lösung 1: Saubere Neuinstallation der Abhängigkeiten**

```bash
# Löschen Sie node_modules und package-lock.json
rm -rf node_modules package-lock.json

# Installieren Sie die Abhängigkeiten neu
npm install

# Starten Sie die App
npm run dev
```

**Lösung 2: Cache löschen und neu bauen**

```bash
rm -rf node_modules dist .vite package-lock.json
npm install
npm run build
```

### TypeScript-Fehler

Falls TypeScript-Fehler wie "Cannot find type definition file" auftreten:

```bash
# Führen Sie eine saubere Installation durch
rm -rf node_modules package-lock.json
npm install
```

Dies stellt sicher, dass alle Type-Definition-Pakete (@types/node, @types/react, etc.) korrekt installiert werden.

### Port bereits belegt

Falls Port 5173 bereits belegt ist:

```bash
# Verwenden Sie einen anderen Port
npm run dev -- --port 3000
```

### Browser zeigt leere Seite

1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Prüfen Sie die Konsole auf Fehlermeldungen
3. Stellen Sie sicher, dass Sie unter `http://localhost:5173` auf die App zugreifen
4. Versuchen Sie einen anderen Browser


