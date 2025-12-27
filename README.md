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

**Lokaler Zugriff:**

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5173` verfügbar.

**Zugriff über IP-Adresse (z.B. von einem Server):**

```bash
npm run dev:host
```

Oder alternativ:

```bash
npm run dev -- --host
```

Die App ist dann über die Server-IP-Adresse zugänglich, z.B. `http://192.168.1.100:5173` oder `http://ihre-server-ip:5173`.

**Hinweis:** Der `--host` Flag ermöglicht den Zugriff von anderen Geräten im Netzwerk. Stellen Sie sicher, dass Port 5173 in Ihrer Firewall geöffnet ist.

### Produktions-Build erstellen

```bash
npm run build
```

Die optimierten Dateien werden im `dist/` Ordner erstellt.

### Produktions-Build lokal testen

```bash
npm run preview
```

Für Zugriff über IP-Adresse:

```bash
npm run preview:host
```

Damit können Sie den Produktions-Build lokal testen, bevor Sie ihn deployen.

## Automatischer Start beim Serverstart

### Mit systemd (Linux) - Entwicklungsmodus

**Hinweis:** Diese Konfiguration startet den Entwicklungsserver. Für Produktivbetrieb siehe "Produktionsmodus mit nginx" weiter unten.

**Schritt 1:** Finden Sie die vollständigen Pfade zu Node und npm:

```bash
which node    # z.B. /usr/bin/node oder /home/user/.nvm/versions/node/v20.0.0/bin/node
which npm     # z.B. /usr/bin/npm oder /home/user/.nvm/versions/node/v20.0.0/bin/npm
```

**Schritt 2:** Erstellen Sie eine systemd Service-Datei `/etc/systemd/system/darts-pwa.service`:

```ini
[Unit]
Description=Darts PWA Development Server
After=network.target

[Service]
Type=simple
User=ihr-benutzername
WorkingDirectory=/vollständiger/pfad/zum/darts-pwa
Environment="NODE_ENV=development"
Environment="PATH=/usr/bin:/usr/local/bin:/home/ihr-benutzername/.nvm/versions/node/v20.0.0/bin"
ExecStart=/vollständiger/pfad/zu/npm run dev:host
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Hinweis:** Dieser Service ist nur für Entwicklung/Testing gedacht. Für Produktivbetrieb verwenden Sie nginx (siehe unten).

**Wichtig:** Ersetzen Sie:
- `ihr-benutzername` mit Ihrem tatsächlichen Benutzernamen
- `/vollständiger/pfad/zum/darts-pwa` mit dem vollständigen Pfad zum Projektverzeichnis (z.B. `/home/user/darts-pwa`)
- `/vollständiger/pfad/zu/npm` mit dem Ergebnis von `which npm`
- Den `PATH` mit dem korrekten Pfad zu Ihrer Node-Installation

**Schritt 3:** Aktivieren und starten Sie den Service:

```bash
# Service neu laden
sudo systemctl daemon-reload

# Service aktivieren (automatischer Start beim Booten)
sudo systemctl enable darts-pwa

# Service starten
sudo systemctl start darts-pwa

# Status überprüfen
sudo systemctl status darts-pwa

# Logs anzeigen
sudo journalctl -u darts-pwa -f
```

**Wichtige Hinweise:**
- **Port 5173** muss in der Firewall geöffnet sein:
  ```bash
  sudo ufw allow 5173/tcp  # Ubuntu/Debian mit ufw
  sudo firewall-cmd --permanent --add-port=5173/tcp  # CentOS/RHEL
  sudo firewall-cmd --reload
  ```
- Für den Produktionsbetrieb empfehlen wir nginx/Apache statt des Entwicklungsservers (siehe unten)

### Mit PM2 (Plattformübergreifend)

PM2 ist ein Production Process Manager für Node.js:

```bash
# PM2 installieren
npm install -g pm2

# App mit PM2 starten
pm2 start npm --name "darts-pwa" -- run dev:host

# Automatischer Start beim Serverstart
pm2 startup
pm2 save

# Status überprüfen
pm2 status

# Logs anzeigen
pm2 logs darts-pwa
```

### Produktionsmodus mit nginx (empfohlen)

Für einen stabilen Produktionsbetrieb sollten Sie nginx verwenden statt des Entwicklungsservers.

**Schritt 1:** Build erstellen

```bash
cd /pfad/zum/darts-pwa
npm run build
```

**Schritt 2:** nginx installieren (falls noch nicht installiert)

```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

**Schritt 3:** nginx Konfiguration erstellen `/etc/nginx/sites-available/darts-pwa`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ihre-domain.de;  # oder IP-Adresse

    root /vollständiger/pfad/zum/darts-pwa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache-Einstellungen für statische Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Schritt 4:** Konfiguration aktivieren und nginx neu starten

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/darts-pwa /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# nginx neu starten
sudo systemctl restart nginx
```

Die App ist dann über `http://ihre-server-ip` oder `http://ihre-domain.de` erreichbar (Port 80).

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

### Zugriff über IP-Adresse nicht möglich

Falls Sie die App auf einem Server hosten und über eine IP-Adresse darauf zugreifen möchten:

```bash
# Starten Sie den Server mit dem --host Flag
npm run dev -- --host

# Oder mit einem bestimmten Port
npm run dev -- --host --port 3000
```

Die App ist dann über die IP-Adresse Ihres Servers zugänglich, z.B.:
- `http://192.168.1.100:5173`
- `http://ihre-server-ip:5173`

**Wichtig:** 
- Stellen Sie sicher, dass der Port (5173 oder ein anderer) in Ihrer Firewall geöffnet ist
- Bei Cloud-Servern müssen Sie möglicherweise Security Groups oder Firewall-Regeln anpassen
```

### Browser zeigt leere Seite

1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Prüfen Sie die Konsole auf Fehlermeldungen
3. Stellen Sie sicher, dass Sie unter `http://localhost:5173` auf die App zugreifen
4. Versuchen Sie einen anderen Browser


