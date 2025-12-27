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

#### Option 1: Statische Dateien (empfohlen für Produktion)

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

    # PWA Service Worker
    location ~* (service-worker\.js|sw\.js|manifest\.webmanifest)$ {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
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

#### Option 2: nginx als Reverse Proxy mit HTTPS

Für den Betrieb hinter nginx mit einer eigenen Domain und HTTPS-Verschlüsselung:

**Schritt 1:** Starten Sie den Entwicklungsserver oder Preview-Server lokal

```bash
# Entwicklungsserver (Port 5173)
npm run dev:host

# ODER Produktions-Preview (Port 4173)
npm run build && npm run preview:host
```

**Schritt 2:** nginx Reverse Proxy Konfiguration `/etc/nginx/sites-available/darts-pwa`:

```nginx
# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name ihre-domain.de www.ihre-domain.de;
    
    # Let's Encrypt Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://ihre-domain.de$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ihre-domain.de www.ihre-domain.de;

    # SSL Zertifikate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ihre-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ihre-domain.de/privkey.pem;
    
    # SSL Konfiguration (Mozilla Modern)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS Header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Weitere Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Reverse Proxy zu lokalem Vite/Node Server
    location / {
        proxy_pass http://localhost:5173;  # oder :4173 für preview
        proxy_http_version 1.1;
        
        # WebSocket Support (wichtig für Vite HMR)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Proxy Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Schritt 3:** SSL-Zertifikat mit Let's Encrypt erstellen

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian

# Verzeichnis für Let's Encrypt Challenge erstellen
sudo mkdir -p /var/www/certbot

# Zertifikat erstellen
sudo certbot certonly --webroot -w /var/www/certbot -d ihre-domain.de -d www.ihre-domain.de

# Automatische Erneuerung einrichten
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Schritt 4:** nginx aktivieren und Firewall konfigurieren

```bash
# nginx Konfiguration aktivieren
sudo ln -s /etc/nginx/sites-available/darts-pwa /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# nginx neu starten
sudo systemctl restart nginx

# Firewall öffnen
sudo ufw allow 'Nginx Full'  # Erlaubt HTTP (80) und HTTPS (443)
sudo ufw delete allow 5173/tcp  # Development-Port kann geschlossen werden
```

**Schritt 5:** systemd Service für automatischen Start erstellen

Erstellen Sie `/etc/systemd/system/darts-pwa.service`:

```ini
[Unit]
Description=Darts PWA Server
After=network.target

[Service]
Type=simple
User=ihr-benutzername
WorkingDirectory=/vollständiger/pfad/zum/darts-pwa
Environment="NODE_ENV=production"
Environment="PATH=/usr/bin:/usr/local/bin:/home/ihr-benutzername/.nvm/versions/node/v20.0.0/bin"
ExecStart=/vollständiger/pfad/zu/npm run dev:host
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Dann aktivieren:

```bash
sudo systemctl daemon-reload
sudo systemctl enable darts-pwa
sudo systemctl start darts-pwa
sudo systemctl status darts-pwa
```

Die App ist dann über `https://ihre-domain.de` sicher erreichbar!

#### Option 3: Produktions-Build mit nginx + systemd

Für beste Performance: Statischer Build mit nginx, automatisch neu gebaut bei Änderungen.

**Deploy-Script erstellen** `/pfad/zum/darts-pwa/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Building Darts PWA..."
cd /pfad/zum/darts-pwa
npm run build

echo "Restarting nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

Ausführbar machen:

```bash
chmod +x /pfad/zum/darts-pwa/deploy.sh
```

Bei Änderungen einfach ausführen:

```bash
./deploy.sh
```

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


