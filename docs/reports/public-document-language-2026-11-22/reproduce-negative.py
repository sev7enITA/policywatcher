#!/usr/bin/env python3
"""Offline negative control. Run only in an isolated checkout with installed dependencies."""
import argparse
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=False)
helper = root / 'src/lib/seo.ts'
fixed = helper.read_bytes()
result = None
try:
    helper.write_bytes(subprocess.check_output(['git', 'show', '30a5eff:src/lib/seo.ts'], cwd=root))
    result = subprocess.run([str(root / 'node_modules/.bin/vitest'), 'run',
                             'src/lib/__tests__/publicDocumentLanguageConsumers.test.tsx'],
                            cwd=root, text=True, capture_output=True, timeout=60)
    (output / 'old-helper.log').write_text(result.stdout + result.stderr)
finally:
    helper.write_bytes(fixed)
    (output / 'receipt.json').write_text(json.dumps({
        'parent': '30a5eff', 'mutatedOnly': 'src/lib/seo.ts',
        'exitCode': result.returncode if result else None,
        'fixedBytesRestored': helper.read_bytes() == fixed,
        'scope': 'Controlled render/effect tests; no browser, network or database.'
    }, indent=2) + '\n')
if result is None or result.returncode == 0:
    raise RuntimeError('Negative control did not produce the required test failure.')
print('Old-helper failure observed; fixed helper bytes restored. See retained receipt/log.')
