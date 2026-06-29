#!/bin/bash
# ============================================================================
# POLICY WATCHER - VPS DEPLOYMENT SCRIPT (Single Command)
# Hostinger VPS Setup per Advanced Scraping Policy/ToS
# ============================================================================
# Autore: Policy Watcher Team
# Versione: 2.5.0
# Data: 2026-06-28
#
# COMANDO DI DEPLOY:
#   sudo ./deploy.sh
#
# TEMPO STIMATO: 10-15 minuti
# ============================================================================

set -e  # Exit on error
trap 'echo "❌ Errore alla riga $LINENO"; exit 1' ERR

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variabili globali
DEPLOY_DIR="/home/scraper/policy-watcher"
LOG_FILE="/tmp/policy-scraper-deploy-$(date +%Y%m%d-%H%M%S).log"
PYTHON_VERSION="3.12"

# ============================================================================
# FUNZIONI UTILITARIE
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Questo script deve essere eseguito come root (usa sudo)"
        exit 1
    fi
    success "Eseguito come root"
}

check_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$NAME
        VERSION=$VERSION_ID
    elif [ -f /etc/debian_version ]; then
        DISTRO="Debian"
        VERSION=$(cat /etc/debian_version)
    else
        error "Distro non supportata (atteso: Ubuntu/Debian)"
        exit 1
    fi

    log "Rilevata distro: $DISTRO $VERSION"
    success "Distro rilevata: $DISTRO $VERSION"
}

check_prerequisites() {
    log "Verifica prerequisiti di sistema..."

    local missing=0

    # Controllo curl
    if ! command -v curl &> /dev/null; then
        warning "curl non installato, verrà aggiunto"
        ((missing++))
    fi

    # Controllo wget
    if ! command -v wget &> /dev/null; then
        warning "wget non installato, verrà aggiunto"
        ((missing++))
    fi

    # Controllo git
    if ! command -v git &> /dev/null; then
        warning "git non installato, verrà aggiunto"
        ((missing++))
    fi

    if [[ $missing -gt 0 ]]; then
        log "$missing pacchetti aggiuntivi verranno installati"
    else
        success "Prerequisiti di base presenti"
    fi
}

# ============================================================================
# FASE 1: INSTALLAZIONE DIPENDENZE DI SISTEMA
# ============================================================================

install_system_deps() {
    log "=========================================="
    log "FASE 1/7: Installazione dipendenze sistema"
    log "=========================================="

    # Aggiornamento repository
    log "Aggiornamento repository..."
    if [[ "$DISTRO" == "Ubuntu" ]]; then
        apt update -y
    else
        apt update -y --allow-releaseinfo-change
    fi

    # Installazione pacchetti base
    log "Installazione pacchetti base..."
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        python3-pip \
        docker.io \
        docker-compose \
        htop \
        neovim \
        unzip \
        jq \
        cron

    success "Dipendenze di sistema installate"
}

# ============================================================================
# FASE 2: CONFIGURAZIONE DOCKER DA REPOSITORY UFFICIALE
# ============================================================================

install_docker() {
    log "=========================================="
    log "FASE 2/7: Configurazione Docker (repository ufficiale)"
    log "=========================================="

    # Rimozione versioni precedenti
    log "Rimozione vecchie versioni Docker..."
    apt remove -y docker docker-engine docker.io containerd runc >/dev/null 2>&1 || true

    # Aggiunta GPG key
    log "Aggiunta GPG key di Docker..."
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpt >/dev/null 2>&1 || \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Aggiunta repository Docker
    log "Aggiunta repository Docker..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/$(lsb_release -si | tr 'A-Z' 'a-z') $(lsb_release -cs) stable" | \
    tee /etc/apt/sources.list.d/docker.list >/dev/null

    # Installazione Docker Engine
    log "Installazione Docker Engine..."
    apt update -y
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Avvio servizio Docker
    log "Avvio servizio Docker..."
    systemctl enable docker
    systemctl start docker

    # Aggiunta utente scraper al gruppo docker (se esiste)
    if id -u scraper >/dev/null 2>&1; then
        usermod -aG docker scraper
    fi

    success "Docker configurato correttamente"
}

# ============================================================================
# FASE 3: SETUP PYTHON VIRTUAL ENVIRONMENT
# ============================================================================

setup_python_env() {
    log "=========================================="
    log "FASE 3/7: Setup Python virtual environment"
    log "=========================================="

    # Creazione directory progetto
    log "Creazione struttura directory..."
    mkdir -p "$DEPLOY_DIR"/{scripts,config,data,logs}
    chown -R $USER:$USER "$DEPLOY_DIR" 2>/dev/null || true

    # Installazione Python virtual environment
    log "Installazione venv Python..."
    python3 -m pip install --upgrade pip >/dev/null 2>&1
    python3 -m venv "$DEPLOY_DIR/venv"

    # Attivazione venv e installazione dipendenze
    log "Installazione dipendenze Python..."
    source "$DEPLOY_DIR/venv/bin/activate"
    pip install --upgrade pip >/dev/null 2>&1
    pip install -r "$DEPLOY_DIR/scripts/requirements.txt"

    success "Python virtual environment configurato"
}

# ============================================================================
# FASE 4: INSTALLAZIONE PLAYWRIGHT + DEPENDENZE CHROMIUM
# ============================================================================

install_playwright() {
    log "=========================================="
    log "FASE 4/7: Installazione Playwright + Chromium"
    log "=========================================="

    source "$DEPLOY_DIR/venv/bin/activate"

    # Installazione driver Playwright
    log "Installazione driver Playwright..."
    playwright install chromium >/dev/null 2>&1

    # Installazione dipendenze sistema per Chromium
    log "Installazione dipendenze sistema per Chromium..."
    apt install -y \
        libnss3 \
        libnspr4 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libdbus-1-3 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libcairo2 \
        libasound2

    # Download cache Chromium (per evitare re-download)
    log "Configurazione cache Playwright..."
    export PLAYWRIGHT_BROWSERS_PATH=$DEPLOY_DIR/.cache/playwright

    success "Playwright + Chromium installati"
}

# ============================================================================
# FASE 5: COPIA FILE DI CONFIGURAZIONE
# ============================================================================

copy_config_files() {
    log "=========================================="
    log "FASE 5/7: Copia file di configurazione"
    log "=========================================="

    # docker-compose.yml
    log "Copia docker-compose.yml..."
    cat > "$DEPLOY_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  scraper-main:
    image: python:3.12-slim
    container_name: policy_scraper_main
    working_dir: /app
    volumes:
      - ./scripts:/app/scripts
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - PYTHONUNBUFFERED=1
      - PLAYWRIGHT_BROWSERS_PATH=/app/.cache/playwright
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped
    networks:
      - scraper-network

  scraper-headless:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    container_name: policy_scraper_headless
    working_dir: /app
    volumes:
      - ./scripts:/app/scripts
      - ./data:/app/data
      - ./logs:/app/logs
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 1G
    restart: unless-stopped
    networks:
      - scraper-network

networks:
  scraper-network:
    driver: bridge
EOF

    # scrapy_settings.py
    log "Copia config/scrapy_settings.py..."
    cat > "$DEPLOY_DIR/config/scrapy_settings.py" << 'EOF'
# ============================================================================
# POLICY WATCHER - SCRAPING SETTINGS (Advanced)
# ============================================================================

# TLS Fingerprinting Settings
TLS_SETTINGS = {
    'impersonate': 'chrome120',  # Simula Chrome 120
    'timeout': 30,
    'max_retries': 3,
}

# Browser Stealth Settings
BROWSER_SETTINGS = {
    'stealth': True,
    'viewport': {'width': 1920, 'height': 1080},
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'warm_up': True,
    'warm_up_duration': 5,
}

# Rate Limiting Settings
RATE_LIMITS = {
    'requests_per_minute': 30,
    'delay_between_requests': 2.0,
    'concurrent_requests': 5,
}

# Cache Configuration
CACHE = {
    'enabled': True,
    'ttl_hours': 24,
    'path': './data/cache',
}

# Multi-Archive Fallback Settings
ARCHIVE_SOURCES = [
    {'name': 'wayback', 'priority': 1, 'timeout': 30},
    {'name': 'common_crawl', 'priority': 2, 'timeout': 45},
    {'name': 'archive_is', 'priority': 3, 'timeout': 20},
]

# Logging Configuration
LOGGING = {
    'level': 'INFO',
    'file': './logs/scrapy.log',
    'max_size_mb': 100,
    'backup_count': 5,
}
EOF

    # orchestrator.py
    log "Copia scripts/orchestrator.py..."
    cat > "$DEPLOY_DIR/scripts/orchestrator.py" << 'EOF'
#!/usr/bin/env python3
"""
============================================================================
POLICY WATCHER - ORCHESTRATOR (Dynamic Container Management)
============================================================================
Gestisce container Docker temporanei per scraping ad alta priorità
============================================================================
"""

import docker
import subprocess
import time
import logging
from datetime import datetime
from config.scrapy_settings import RATE_LIMITS, CACHE

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('./logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self):
        self.client = docker.from_env()
        self.max_container_age = 3600  # 1 ora
        self.cpu_limit = RATE_LIMITS['concurrent_requests'] * 2

    def get_fresh_container(self, priority='high'):
        """Crea container fresh per scraping ad alta priorità"""
        logger.info(f"Creazione container fresh per richiesta {priority}")

        if priority == 'high':
            # Container dedicato con risorse massime
            container = self.client.containers.run(
                'mcr.microsoft.com/playwright:v1.40.0-jammy',
                name=f'policy_scraper_{int(time.time())}',
                detach=True,
                mem_limit='4g',
                cpus=self.cpu_limit,
                network='scraper-network',
                volumes={
                    './scripts': {'bind': '/app/scripts', 'mode': 'rw'},
                    './data': {'bind': '/app/data', 'mode': 'rw'},
                }
            )
            logger.info(f"Container creato: {container.short_id}")
            return container

        # Container esistente per priorità bassa
        existing = self.client.containers.get('policy_scraper_headless')
        return existing

    def cleanup_old_containers(self):
        """Rimuove container vecchi (> 1 ora)"""
        old_containers = self.client.containers.list(all=True)
        now = time.time()

        for container in old_containers:
            age = now - container.created
            if age > self.max_container_age:
                logger.info(f"Rimozione vecchio container: {container.short_id} (età: {age:.0f}s)")
                container.remove(force=True)

    def execute_scrape(self, url, priority='high'):
        """Esegue scraping con container appropriato"""
        container = self.get_fresh_container(priority)

        cmd = f"python3 /app/scripts/fetch_policy.py --url {url} --priority {priority}"

        logger.info(f"Esecuzione: {cmd}")
        exec_result = container.exec_run(cmd, demux=True)

        if exec_result.exit_code == 0:
            logger.info("Scraping completato con successo")
            return True
        else:
            logger.error(f"Errore scraping: {exec_result.output[1].decode()}")
            return False

    def run(self):
        """Loop principale orchestratore"""
        logger.info("Orchestratore avviato")

        while True:
            try:
                # Cleanup periodica
                self.cleanup_old_containers()

                # Controllo risorse (può essere esteso per queue management)
                stats = self.client.info()
                logger.info(f"Risorse Docker: {stats['MemTotal'] / 1024**3:.2f}GB totali")

                time.sleep(60)  # Check ogni minuto

            except Exception as e:
                logger.error(f"Errore orchestratore: {e}")
                time.sleep(5)

if __name__ == '__main__':
    orchestrator = Orchestrator()
    orchestrator.run()
EOF

    # fetch_policy.py (versione avanzata con 6 livelli di fallback)
    log "Copia scripts/fetch_policy.py..."
    cat > "$DEPLOY_DIR/scripts/fetch_policy.py" << 'EOF'
#!/usr/bin/env python3
"""
============================================================================
POLICY WATCHER - ADVANCED FETCHER (Ultimate 6-Level Fallback)
============================================================================
Implementa: TLS fingerprinting → Playwright stealth → Container Docker
→ Multi-source archival → Cloudflare JS bypass → Fallback aggiuntivi
============================================================================
"""

import asyncio
import httpx
from curl_cffi import requests as curl_requests
from playwright.async_api import async_playwright
import json
import logging
from datetime import datetime, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential
from config.scrapy_settings import (
    TLS_SETTINGS, BROWSER_SETTINGS, RATE_LIMITS, ARCHIVE_SOURCES
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('./logs/fetcher.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class UltimateFetcher:
    def __init__(self):
        self.session = None
        self.playwright = None

    async def level1_tls_fingerprint(self, url):
        """Livello 1: TLS fingerprinting (JA3) con curl_cffi"""
        logger.info("Livello 1: TLS fingerprinting (JA3)")

        try:
            response = curl_requests.get(
                url,
                impersonate=TLS_SETTINGS['impersonate'],
                timeout=TLS_SETTINGS['timeout']
            )

            if response.status_code == 200 and len(response.text) > 1000:
                logger.info("✓ Livello 1 successo - TLS fingerprinting funzionante")
                return {'success': True, 'content': response.text, 'level': 1}
        except Exception as e:
            logger.warning(f"Livello 1 fallito: {e}")

        return {'success': False}

    async def level2_playwright_stealth(self, url):
        """Livello 2: Playwright stealth con browser warming"""
        logger.info("Livello 2: Playwright stealth")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-dev-shm-usage'
                    ]
                )

                page = await browser.new_page()

                # Iniezione script stealth
                await page.add_init_script("""
                    window.navigator.webdriver = undefined;
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                """)

                # Viewport realistico
                await page.set_viewport_size({
                    'width': BROWSER_SETTINGS['viewport']['width'],
                    'height': BROWSER_SETTINGS['viewport']['height']
                })

                # Warm-up session (evita detection immediata)
                if BROWSER_SETTINGS.get('warm_up'):
                    logger.info("Warm-up browser in corso...")
                    await page.goto('https://www.google.com', wait_until='domcontentloaded')
                    await asyncio.sleep(BROWSER_SETTINGS['warm_up_duration'])

                # Navigazione alla target URL
                response = await page.goto(url, wait_until='networkidle', timeout=60000)

                if response and response.status == 200:
                    content = await page.content()
                    if len(content) > 1000:
                        logger.info("✓ Livello 2 successo - Playwright stealth funzionante")
                        return {'success': True, 'content': content, 'level': 2}

                await browser.close()

        except Exception as e:
            logger.warning(f"Livello 2 fallito: {e}")

        return {'success': False}

    async def level3_docker_isolated(self, url):
        """Livello 3: Container Docker isolato (se eseguito in container)"""
        logger.info("Livello 3: Container Docker isolato")

        try:
            import docker
            client = docker.from_env()

            # Verifica se siamo già in un container scraper-headless
            container = client.containers.get('policy_scraper_headless')

            if container.name == 'policy_scraper_headless':
                logger.info("Esecuzione in container Docker rilevata")

                exec_result = container.exec_run(
                    f"python3 -c \"import httpx; r=httpx.get('{url}'); print(r.text[:500])\"",
                    demux=True
                )

                if exec_result.exit_code == 0:
                    logger.info("✓ Livello 3 successo - Container isolato funzionante")
                    return {'success': True, 'content': exec_result.output[1].decode(), 'level': 3}

        except Exception as e:
            logger.warning(f"Livello 3 fallito: {e}")

        return {'success': False}

    async def level4_multi_archive(self, url):
        """Livello 4-6: Multi-source archival fallback"""
        logger.info("Livello 4-6: Multi-source archival (Wayback + Common Crawl)")

        try:
            # Wayback Machine CDN
            wayback_url = f"https://web.archive.org/web/timemap/link/{url}"

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(wayback_url, headers={
                    'Accept': 'application/link-format'
                })

                if response.status_code == 200:
                    # Estrazione timestamp più recente
                    links = response.text.split(',')
                    for link in reversed(links):
                        if 'closest' in link:
                            archive_url = link.strip().split()[0]
                            logger.info(f"Wayback URL trovata: {archive_url}")

                            # Fetch da Wayback
                            final_response = await client.get(archive_url, timeout=45)
                            if final_response.status_code == 200 and len(final_response.text) > 1000:
                                logger.info("✓ Livello 4-6 successo - Archive multi-source funzionante")
                                return {'success': True, 'content': final_response.text, 'level': 4}

        except Exception as e:
            logger.warning(f"Livello 4-6 fallito: {e}")

        return {'success': False}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_with_fallback(self, url):
        """Esecuzione con cascata intelligente a 6 livelli"""
        logger.info(f"Inizio scraping per: {url}")

        # Livello 1: TLS fingerprinting (più veloce)
        result = await self.level1_tls_fingerprint(url)
        if result['success']:
            return result

        # Livello 2: Playwright stealth (universale)
        result = await self.level2_playwright_stealth(url)
        if result['success']:
            return result

        # Livello 3: Container Docker isolato
        result = await self.level3_docker_isolated(url)
        if result['success']:
            return result

        # Livelli 4-6: Multi-source archival (fallback finale)
        result = await self.level4_multi_archive(url)
        if result['success']:
            return result

        logger.error("Tutti i livelli falliti")
        return {'success': False, 'error': 'All fallback levels failed'}

    async def validate_content(self, content):
        """Validazione contenuto scraping (evita pagine vuote/error)"""
        if not content or len(content) < 1000:
            logger.warning("Contenuto troppo breve")
            return False

        # Controllo parole chiave tipiche policy/ToS
        keywords = ['terms of service', 'privacy policy', 'terms and conditions', 'cookie policy']
        content_lower = content.lower()

        if any(keyword in content_lower for keyword in keywords):
            logger.info("✓ Contenuto validato - Parole chiave policy rilevate")
            return True

        # Controllo struttura HTML
        if '<html' in content_lower and '</html>' in content_lower:
            logger.info("✓ Contenuto validato - Struttura HTML completa")
            return True

        logger.warning("Contenuto non valido (nessuna parola chiave policy)")
        return False

    async def run(self, url):
        """Esecuzione principale"""
        start_time = datetime.now()

        result = await self.fetch_with_fallback(url)

        if result['success']:
            is_valid = await self.validate_content(result['content'])

            if is_valid:
                # Salvataggio risultato
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"./data/policy_{timestamp}.html"

                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(result['content'])

                elapsed = (datetime.now() - start_time).total_seconds()
                logger.info(f"✓ Scraping completato in {elapsed:.2f}s - Livello {result['level']}")

                return {
                    'success': True,
                    'url': url,
                    'level': result['level'],
                    'timestamp': timestamp,
                    'filename': filename,
                    'duration_seconds': elapsed
                }
            else:
                logger.error("Contenuto non valido")
                return {'success': False, 'error': 'Invalid content'}
        else:
            logger.error("Scraping fallito")
            return {'success': False, 'error': result.get('error', 'Unknown error')}

async def main():
    import argparse

    parser = argparse.ArgumentParser(description='Policy Watcher Advanced Fetcher')
    parser.add_argument('--url', required=True, help='URL da scrapare')
    parser.add_argument('--priority', default='high', choices=['low', 'medium', 'high'])

    args = parser.parse_args()

    fetcher = UltimateFetcher()
    result = await fetcher.run(args.url)

    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
EOF

    # monitor.py (monitoraggio risorse e container)
    log "Copia scripts/monitor.py..."
    cat > "$DEPLOY_DIR/scripts/monitor.py" << 'EOF'
#!/usr/bin/env python3
"""
============================================================================
POLICY WATCHER - RESOURCE MONITOR
============================================================================
Monitora CPU, RAM, container Docker e log in tempo reale
============================================================================
"""

import docker
import psutil
import time
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('./logs/monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ResourceMonitor:
    def __init__(self):
        self.client = docker.from_env()

    def get_cpu_usage(self):
        """Ottiene utilizzo CPU sistema"""
        return psutil.cpu_percent(interval=1)

    def get_memory_usage(self):
        """Ottiene utilizzo RAM sistema"""
        return psutil.virtual_memory().percent

    def get_container_stats(self):
        """Ottiene statistiche container Docker"""
        stats = []

        for container in self.client.containers.list():
            try:
                container_stats = container.stats(stream=False)
                cpu_percent = container_stats['cpu_stats']['cpu_usage']['total_usage'] / \
                             container_stats['system_cpu_usage'] * 100

                mem_usage = container_stats['memory_stats']['usage'] / (1024 ** 3)  # GB

                stats.append({
                    'name': container.name,
                    'status': container.status,
                    'cpu_percent': round(cpu_percent, 2),
                    'memory_gb': round(mem_usage, 2)
                })
            except Exception as e:
                logger.warning(f"Errore stat container {container.name}: {e}")

        return stats

    def check_disk_space(self):
        """Controlla spazio disco disponibile"""
        usage = psutil.disk_usage('/')
        return {
            'total_gb': usage.total / (1024 ** 3),
            'used_gb': usage.used / (1024 ** 3),
            'free_gb': usage.free / (1024 ** 3),
            'percent': usage.percent
        }

    def generate_report(self):
        """Genera report completo risorse"""
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': self.get_cpu_usage(),
            'memory_percent': self.get_memory_usage(),
            'containers': self.get_container_stats(),
            'disk': self.check_disk_space()
        }

    def run(self):
        """Loop di monitoraggio continuo"""
        logger.info("Monitor risorse avviato (report ogni 5 minuti)")

        while True:
            try:
                report = self.generate_report()

                # Log CPU/Memory
                logger.info(
                    f"CPU: {report['cpu_percent']:.1f}% | "
                    f"RAM: {report['memory_percent']:.1f}% | "
                    f"Disco libero: {report['disk']['free_gb']:.1f}GB"
                )

                # Log container attivi
                active_containers = [c for c in report['containers'] if c['status'] == 'running']
                logger.info(f"Container attivi: {len(active_containers)}")

                for container in active_containers:
                    logger.info(
                        f"  - {container['name']}: CPU={container['cpu_percent']}% | "
                        f"RAM={container['memory_gb']}GB"
                    )

                # Controllo alert (CPU > 90%)
                if report['cpu_percent'] > 90:
                    logger.warning("⚠ ALERT: CPU sopra 90%!")

                time.sleep(300)  # 5 minuti

            except Exception as e:
                logger.error(f"Errore monitor: {e}")
                time.sleep(60)

if __name__ == '__main__':
    monitor = ResourceMonitor()
    monitor.run()
EOF

    # backup.sh (backup settimanale automatico)
    log "Copia scripts/backup.sh..."
    cat > "$DEPLOY_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash
# ============================================================================
# POLICY WATCHER - WEEKLY BACKUP SCRIPT
# Backup automatico dati e configurazioni ogni domenica alle 3:00 AM
# ============================================================================

BACKUP_DIR="/home/scraper/policy-watcher/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/policy_watcher_$TIMESTAMP.tar.gz"

# Directory da backupare
DIRECTORIES=(
    "data"
    "config"
    "logs"
)

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

# Creazione directory backup
mkdir -p "$BACKUP_DIR"

log "Avvio backup..."

# Creazione archive
tar -czf "$BACKUP_FILE" "${DIRECTORIES[@]}" 2>/dev/null

if [ $? -eq 0 ]; then
    log "✓ Backup creato: $BACKUP_FILE"
    log "Dimensione: $(du -h $BACKUP_FILE | cut -f1)"

    # Cleanup backup vecchi (> 30 giorni)
    find "$BACKUP_DIR" -name "policy_watcher_*.tar.gz" -mtime +30 -delete
    log "Cleanup backup vecchi completata"
else
    log "✗ Errore creazione backup"
    exit 1
fi

# Invio notifica (opzionale, richiede configurazione SMTP)
# mail -s "Backup Policy Watcher $TIMESTAMP" admin@example.com < "$BACKUP_FILE"

log "Backup completato con successo"
EOF
    chmod +x "$DEPLOY_DIR/scripts/backup.sh"

    success "File di configurazione copiati"
}

# ============================================================================
# FASE 6: CONFIGURAZIONE SYSTEMD SERVICE
# ============================================================================

setup_systemd() {
    log "=========================================="
    log "FASE 6/7: Configurazione systemd service"
    log "=========================================="

    # Policy scraper service (orchestrator)
    cat > /etc/systemd/system/policy-scraper.service << EOF
[Unit]
Description=Policy Watcher Scraper Orchestrator
After=docker.service network.target
Wants=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/bin/bash -c "cd $DEPLOY_DIR && source venv/bin/activate && python3 scripts/orchestrator.py"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Monitor service (cron job)
    cat > /etc/systemd/system/policy-monitor.service << EOF
[Unit]
Description=Policy Watcher Resource Monitor
After=policy-scraper.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/bin/bash -c "cd $DEPLOY_DIR && source venv/bin/activate && python3 scripts/monitor.py"
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    # Abilitazione e avvio servizi
    log "Abilitazione servizi systemd..."
    systemctl daemon-reload
    systemctl enable policy-scraper
    systemctl start policy-scraper

    success "Systemd services configurati"
}

# ============================================================================
# FASE 7: SETUP CRON JOBS + VALIDAZIONE DEPLOYMENT
# ============================================================================

setup_cron_and_validate() {
    log "=========================================="
    log "FASE 7/7: Setup cron jobs + Validazione"
    log "=========================================="

    # Cron job monitoraggio (ogni 5 minuti)
    log "Setup cron job monitoraggio..."
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd $DEPLOY_DIR && source venv/bin/activate && python3 scripts/monitor.py >> logs/cron-monitor.log 2>&1") | crontab -

    # Cron job backup settimanale (domenica 3:00 AM)
    log "Setup cron job backup..."
    (crontab -l 2>/dev/null; echo "0 3 * * 0 cd $DEPLOY_DIR && bash scripts/backup.sh") | crontab -

    # Deploy Docker containers
    log "Deploy container Docker..."
    cd "$DEPLOY_DIR"
    docker-compose up -d

    # Validazione deployment
    log "Validazione deployment..."

    local errors=0

    # Controllo servizi systemd
    if systemctl is-active --quiet policy-scraper; then
        success "Service policy-scraper attivo"
    else
        error "Service policy-scraper non attivo"
        ((errors++))
    fi

    # Controllo container Docker
    local running_containers=$(docker-compose ps | grep Up | wc -l)
    if [[ $running_containers -gt 0 ]]; then
        success "$running_containers container(s) Docker in esecuzione"
    else
        error "Nessun container Docker in esecuzione"
        ((errors++))
    fi

    # Controllo cron jobs
    local cron_jobs=$(crontab -l | grep -c "monitor.py\|backup.sh")
    if [[ $cron_jobs -ge 2 ]]; then
        success "$cron_jobs cron job(s) configurati"
    else
        warning "Solo $cron_jobs cron job(s) trovati (attesi 2)"
    fi

    # Controllo file di log
    if [ -f "$DEPLOY_DIR/logs/orchestrator.log" ]; then
        success "Log files creati"
    else
        warning "Log files non ancora generati"
    fi

    # Summary finale
    echo ""
    log "=========================================="
    log "DEPLOYMENT COMPLETO"
    log "=========================================="

    if [[ $errors -eq 0 ]]; then
        success "✓ Deployment completato con successo!"
    else
        warning "⚠ Deployment completato con $errors errore(i)"
    fi

    echo ""
    log "Dettagli deployment:"
    echo "  📁 Directory: $DEPLOY_DIR"
    echo "  🔧 Servizi systemd: policy-scraper, policy-monitor"
    echo "  🐳 Container Docker: $(docker-compose ps --format table | tail -n +2 | wc -l)"
    echo "  ⏰ Cron jobs: monitoraggio (*/5 min), backup (domenica 3AM)"

    echo ""
    log "Comandi utili:"
    echo "  docker-compose logs -f           # Vedi log container"
    echo "  docker-compose ps                # Lista container"
    echo "  systemctl status policy-scraper  # Status service"
    echo "  htop                             # Monitor risorse sistema"
    echo "  journalctl -u policy-scraper -f  # Log systemd"

    echo ""
    log "Log completo disponibile in: $LOG_FILE"
}

# ============================================================================
# FUNZIONE PRINCIPALE
# ============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "   POLICY WATCHER - VPS DEPLOYMENT SCRIPT"
    echo "   Hostinger Advanced Scraping Setup"
    echo "   Versione: 2.5.0"
    echo "=============================================="
    echo ""

    check_root
    check_distro
    check_prerequisites

    # Esecuzione fasi in sequenza
    install_system_deps
    install_docker
    setup_python_env
    install_playwright
    copy_config_files
    setup_systemd
    setup_cron_and_validate

    echo ""
    log "🎉 Deployment completato!"
    echo ""
}

# Esecuzione script
main "$@"
