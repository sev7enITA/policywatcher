#!/usr/bin/env python3
"""Install/launch the containing app on a new isolated simulator. Never drives Mac GUI or enables Safari."""
import argparse
import datetime
import hashlib
import json
import plistlib
import re
import subprocess
import time
from pathlib import Path


def command(args, timeout=60):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--family', choices=['iPhone', 'iPad'], default='iPhone')
    args = parser.parse_args()
    app = args.app.resolve()
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    if info['CFBundleIdentifier'] != 'online.policywatcher.safari':
        raise RuntimeError('Only the expected containing app is allowed.')
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError('Choose a new evidence directory; previous attempts must remain intact.')
    output.mkdir(parents=True)
    runs = []
    def sim(*arguments, timeout=60):
        result = command(['xcrun', 'simctl', *arguments], timeout)
        runs.append({'operation': arguments[0], 'exitCode': result.returncode,
                     'stdout': result.stdout, 'stderr': result.stderr})
        if result.returncode:
            raise RuntimeError('simctl ' + arguments[0] + ' failed; see operations.json')
        return result.stdout
    device = None
    receipt = {'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'appBundleIdentifier': info['CFBundleIdentifier'], 'version': info['CFBundleShortVersionString'],
               'build': info['CFBundleVersion'], 'containingAppOnly': True,
               'macSimulatorAppOpened': False, 'safariExtensionExecution': 'not_executed',
               'physicalDeviceExecution': 'not_executed', 'status': 'running'}
    try:
        runtimes = json.loads(sim('list', 'runtimes', '--json'))['runtimes']
        minimum = tuple(int(n) for n in info['MinimumOSVersion'].split('.'))
        selection = [(r, d) for r in runtimes if r.get('isAvailable') and r.get('identifier', '').startswith('com.apple.CoreSimulator.SimRuntime.iOS-') and tuple(int(n) for n in r['version'].split('.')) >= minimum
                     for d in r.get('supportedDeviceTypes', []) if d.get('productFamily') == args.family]
        if not selection:
            raise RuntimeError('No installed runtime supports the requested device family; do not infer execution from a build.')
        runtime, kind = selection[0]
        receipt.update({'runtime': runtime['name'], 'deviceType': kind['name']})
        name = 'PolicyWatcher Safari QA ' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
        device = sim('create', name, kind['identifier'], runtime['identifier']).strip()
        receipt['dedicatedSimulatorId'] = device
        sim('boot', device)
        sim('bootstatus', device, '-b', timeout=180)
        sim('install', device, str(app))
        launched = sim('launch', '--stdout=' + str(output / 'app-stdout.log'), '--stderr=' + str(output / 'app-stderr.log'), device, info['CFBundleIdentifier'])
        pid = int(re.search(r': (\d+)\s*$', launched)[1])
        time.sleep(3)
        process = command(['ps', '-p', str(pid), '-o', 'command='])
        if process.returncode or device not in process.stdout or '/PolicyWatcher.app/PolicyWatcher' not in process.stdout:
            raise RuntimeError('Containing app process not alive at bounded observation.')
        sim('io', device, 'screenshot', '--display=1', str(output / 'containing-app-display1.png'))
        screenshot = output / 'containing-app-display1.png'
        receipt.update({'status': 'containing_app_launched_screenshot_captured', 'aliveAfterSeconds': 3,
                        'screenshotSha256': hashlib.sha256(screenshot.read_bytes()).hexdigest(),
                        'limit': 'Screenshot requires visual inspection; no scrolling, link activation, Safari enablement/injection or live query is tested.'})
    except (RuntimeError, subprocess.TimeoutExpired) as error:
        receipt.update({'status': 'failed_or_unavailable', 'failure': str(error)})
        raise
    finally:
        if device:
            stopped = command(['xcrun', 'simctl', 'shutdown', device])
            receipt['ownSimulatorShutdownExit'] = stopped.returncode
        receipt['completedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        (output / 'operations.json').write_text(json.dumps(runs, indent=2) + '\n')
        (output / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
