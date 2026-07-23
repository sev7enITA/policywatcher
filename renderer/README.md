# PolicyWatcher Renderer (VPS)

Servizio di rendering con browser headless (Playwright/Chromium) per la
strategia 3 dello scraper (`rendered fetch`). Va deployato su una VPS: recupera
le pagine SPA / protette da bot (Meta, X, TikTok, OpenAI, …) che il fetch HTTP
puro non riesce a vedere.

## API

| Endpoint | Metodo | Auth | Descrizione |
|---|---|---|---|
| `/render` | POST `{ "url": "https://..." }` | `Authorization: Bearer <RENDERER_SECRET>` | Rende la pagina e restituisce `{ html, finalUrl, status }` |
| `/healthz` | GET | nessuna | Liveness check `{ ok: true, active }` |

Protezioni incluse: bearer secret obbligatorio (il servizio **rifiuta di
partire** senza), validazione SSRF delle request browser (IP privati,
localhost, credenziali in URL), controllo Public Suffix List sull'URL finale,
controllo delle subresource richieste dal browser, cap di concorrenza, contesto
browser fresco per ogni richiesta, risorse pesanti (immagini/media/font)
bloccate.

Nota di sicurezza: il renderer valida le boundary request di Playwright, ma
Chromium gestisce direttamente i socket. Il pinning DNS forte viene applicato
nello scraper Node.js per i fetch HTTP/1.1 e HTTP/2, dove l'app controlla la
connessione TCP/TLS.

## Deploy sulla VPS

```bash
# 1. Copia la cartella renderer/ sulla VPS, poi:
cd renderer
npm install                                  # installa Playwright + Chromium
npx playwright install-deps chromium         # dipendenze di sistema (richiede sudo)

# 2. Prova manuale
RENDERER_SECRET="$(openssl rand -hex 32)" node server.mjs
# in un altro terminale:
curl -s -X POST http://localhost:8787/render \
  -H "Authorization: Bearer <lo-stesso-secret>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.facebook.com/privacy/policy/"}' | head -c 300
```

### Servizio systemd

`/etc/systemd/system/policywatcher-renderer.service`:

```ini
[Unit]
Description=PolicyWatcher Renderer
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/policywatcher-renderer
Environment=PORT=8787
Environment=RENDERER_SECRET=<secret-ad-alta-entropia>
ExecStart=/usr/bin/node server.mjs
Restart=always
RestartSec=5
# Chromium ha bisogno di /dev/shm decente; su VPS piccole aiuta:
# Environment=NODE_OPTIONS=--max-old-space-size=512

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now policywatcher-renderer
```

### Esposizione HTTPS

Metti il servizio dietro il reverse proxy già presente sulla VPS (nginx/Caddy)
con un sottodominio dedicato, es. `https://render.policywatcher.online`:

```nginx
server {
    server_name render.policywatcher.online;
    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_read_timeout 90s;
    }
    # + certificati (certbot)
}
```

## Configurazione lato app (Hostinger)

Nel `.env` dell'app Next.js:

```
RENDERER_URL=https://render.policywatcher.online
RENDERER_SECRET=<lo-stesso-secret>
```

Se le variabili non sono impostate, lo scraper salta la strategia rendered e
prosegue con gli archivi (Wayback / Common Crawl): il servizio è opzionale ma
fortemente consigliato per la copertura dei siti SPA.

## Variabili d'ambiente del servizio

| Variabile | Default | Note |
|---|---|---|
| `PORT` | `8787` | Porta di ascolto |
| `RENDERER_SECRET` | - | **Obbligatoria** |
| `NAV_TIMEOUT_MS` | `45000` | Timeout navigazione per pagina |
| `MAX_CONCURRENCY` | `3` | Render simultanei massimi |
| `RENDER_USER_AGENT` | Chrome 126 macOS | UA del browser |
