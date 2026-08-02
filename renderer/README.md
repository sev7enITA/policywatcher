# PolicyWatcher Renderer (VPS)

Servizio di rendering con browser headless (Playwright/Chromium) per la
strategia 3 dello scraper (`rendered fetch`). Va deployato su una VPS: recupera
le pagine SPA / protette da bot (Meta, X, TikTok, OpenAI, …) che il fetch HTTP
puro non riesce a vedere.

## API

| Endpoint | Metodo | Auth | Descrizione |
|---|---|---|---|
| `/render` | POST `{ "url": "https://..." }` | `Authorization: Bearer <RENDERER_SECRET>` | Rende la pagina e restituisce `{ html, finalUrl, status }` |
| `/healthz` | GET | nessuna | Liveness minimale: servizio e versione, senza dettagli operativi |
| `/readyz` | GET | bearer secret | Readiness autenticata di Chromium, capacita, allowlist e stato rotazione |

Protezioni incluse: secret primario di almeno 32 caratteri, overlap opzionale
con il secret precedente durante la rotazione, allowlist obbligatoria dei
domini di destinazione, HTTPS obbligatorio, validazione SSRF delle request
browser (IP privati, localhost, credenziali in URL), controllo Public Suffix
List sull'URL finale, allowlist separata per subresource cross-site, cap di
concorrenza, timeout totale, cap della risposta HTML, contesto browser fresco
per ogni richiesta, risorse pesanti (immagini/media/font) bloccate, query e
fragment rimossi dai log e arresto con stato draining. Il renderer usa di
default lo User-Agent nativo della versione di Chromium installata da
Playwright, evitando disallineamenti tra firma dichiarata e browser reale.

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
RENDERER_SECRET="$(openssl rand -hex 32)" \
RENDERER_ALLOWED_DOMAINS="policywatcher.online,facebook.com" node server.mjs
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
User=policywatcher
WorkingDirectory=/opt/policywatcher-renderer/current
Environment=PORT=8787
Environment=RENDERER_SECRET=<secret-ad-alta-entropia>
Environment=RENDERER_ALLOWED_DOMAINS=policywatcher.online,facebook.com
Environment=PLAYWRIGHT_BROWSERS_PATH=/opt/policywatcher-renderer/playwright-browsers
ExecStart=/usr/bin/node /opt/policywatcher-renderer/current/server.mjs
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

## Aggiornamenti gestiti dall Admin Center

Dopo il bootstrap una tantum di VPS Operations Agent 0.2, le release Renderer
successive non richiedono staging SCP o comandi di deploy manuali. In
`Admin → VPS Services`, un amministratore seleziona lo ZIP, verifica la
versione inferita e avvia `Upload, verify and deploy`. Il browser calcola
SHA-256, Hostinger inoltra il pacchetto con firma HMAC e l Agent applica limite
di 5 MiB compressi e 64 MiB estratti, controlli archivio e parita dei metadata prima di `npm ci`, switch,
restart, smoke test e rollback. Il pannello segue lo stato asincrono fino al
risultato; Auditor resta in sola lettura.

Il servizio systemd deve usare il percorso `current` mostrato sopra. L'Agent e
il Renderer devono inoltre condividere utente e `PLAYWRIGHT_BROWSERS_PATH`,
cosi il Chromium installato dal `postinstall` del pacchetto resta leggibile
dopo l'attivazione. Anche la prima release puo essere caricata da Admin: in
assenza di una versione corrente il backup iniziale viene registrato come
saltato.

## Variabili d'ambiente del servizio

| Variabile | Default | Note |
|---|---|---|
| `PORT` | `8787` | Porta di ascolto |
| `RENDERER_SECRET` | - | **Obbligatoria** |
| `RENDERER_SECRET_PREVIOUS` | - | Secret precedente accettato solo durante la rotazione |
| `RENDERER_ALLOWED_DOMAINS` | - | **Obbligatoria**; domini registrabili separati da virgola |
| `RENDERER_SUBRESOURCE_ALLOWED_DOMAINS` | - | Domini cross-site necessari per script/XHR |
| `NAV_TIMEOUT_MS` | `45000` | Timeout navigazione per pagina |
| `RENDER_TOTAL_TIMEOUT_MS` | `70000` | Timeout complessivo per render |
| `MAX_CONCURRENCY` | `3` | Render simultanei massimi |
| `MAX_HTML_BYTES` | `5000000` | Dimensione massima della risposta HTML |
| `RENDER_USER_AGENT` | User-Agent nativo di Chromium | Override operatore opzionale; massimo 512 caratteri su una sola riga |

La readiness autenticata espone anche `browserVersionMajor` e `userAgentMode`.
Usa l'override solo per compatibilita documentata con una fonte: il default
`browser-default` resta l'impostazione raccomandata. Il renderer non installa
plugin stealth e non tenta di aggirare CAPTCHA o controlli WAF; per fonti che
negano l'accesso vanno preferiti endpoint ufficiali, feed o archivi ammessi.

## Rotazione del secret

1. Imposta il nuovo valore in `RENDERER_SECRET` e sposta temporaneamente il
   valore corrente in `RENDERER_SECRET_PREVIOUS` sul renderer.
2. Riavvia il renderer e verifica `/readyz`: `secretRotation` deve risultare
   `overlap-active`.
3. Aggiorna `RENDERER_SECRET` nell'applicazione e completa uno smoke render.
4. Rimuovi `RENDERER_SECRET_PREVIOUS`, riavvia e verifica lo stato
   `single-active`.

La readiness conferma solo che Chromium e la configurazione locale sono
utilizzabili al momento del check. Non certifica la fonte resa, la continuita
del servizio o l'assenza di percorsi di rete esterni al boundary di Playwright.
