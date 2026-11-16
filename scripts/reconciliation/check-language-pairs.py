"""Regenerate the published language pairs and validate the cross-path pair."""
import csv
import io
import subprocess
import sys
import tempfile
from pathlib import Path

base = Path('docs/reports/engine-v6-reconciliation-2026-11-16')
fixed = Path('docs/reports/engine-v6-evidence-fixes-2026-11-16')
with tempfile.TemporaryDirectory() as temp:
    target = Path(temp) / 'pairs.csv'
    subprocess.run([sys.executable, 'scripts/reconciliation/language-pairs.py', base/'public-pages.csv',
                    base/'sections.csv', fixed/'sitemap.xml.gz', target], check=True)
    if target.read_bytes() != (fixed/'language-pairs.csv').read_bytes():
        sys.exit('Corrected matrix drifted')
    rows = list(csv.DictReader(io.StringIO(target.read_text())))
    pair, = (r for r in rows if r['path'] == '/en/associations')
    if not (pair['en_http'] == pair['it_http'] == '200' and pair['it_url'].endswith('/it/associazioni')
            and pair['method'] == 'reciprocal sitemap alternates'):
        sys.exit('Cross-path associations pair was lost')
