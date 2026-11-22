#!/usr/bin/env python3
"""Generate a traceable, unsigned Safari iOS candidate. Never signs or uploads."""
import argparse
import hashlib
import json
import plistlib
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNTIME = ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'service-worker.js',
           '_locales/en/messages.json', '_locales/it/messages.json',
           'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png']
WRAPPER_VERSION = '0.1.0'
WRAPPER_BUILD = '1'
APP_ID = 'online.policywatcher.safari'
EXTENSION_ID = APP_ID + '.Extension'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(args, log):
    result = subprocess.run(args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=900)
    log.write_text(result.stdout)
    if result.returncode:
        raise RuntimeError(f'{Path(args[0]).name} failed ({result.returncode}); see {log.name}')
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--build', choices=['none', 'simulator', 'device', 'all'], default='none')
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        raise RuntimeError('Output already exists; preserve earlier evidence and choose a new directory.')
    dirty = subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], cwd=ROOT, text=True)
    if dirty.strip():
        raise RuntimeError('Commit tracked source before packaging.')
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    output.mkdir(parents=True)
    logs = output / 'logs'
    logs.mkdir()
    run(['node', 'scripts/validate-browser-extension.mjs'], logs / 'runtime-validation.log')
    inputs = output / 'runtime-source'
    inputs.mkdir()
    for name in RUNTIME:
        target = inputs / name
        target.parent.mkdir(parents=True, exist_ok=True)
        source = ROOT / 'browser-extension' / name
        if source.is_symlink() or not source.is_file():
            raise RuntimeError('Runtime inputs must be ordinary reviewed files.')
        shutil.copyfile(source, target)
    manifest = json.loads((inputs / 'manifest.json').read_text())
    run(['xcrun', 'safari-web-extension-packager', str(inputs), '--project-location', str(output / 'apple-project'),
         '--app-name', 'PolicyWatcher', '--bundle-identifier', APP_ID, '--swift', '--ios-only',
         '--copy-resources', '--no-open', '--no-prompt'], logs / 'apple-packager.log')
    project_root = output / 'apple-project/PolicyWatcher'
    project = project_root / 'PolicyWatcher.xcodeproj/project.xcproj'
    if not project.is_file():
        raise RuntimeError('Unrecognized Apple project format. Review generated project rather than patching blindly.')
    text = project.read_text()
    identities = re.findall(r'"PRODUCT_BUNDLE_IDENTIFIER": "([^"]+)"', text)
    if len(identities) != 2:
        raise RuntimeError('Expected precisely two generated bundle identifiers.')
    index = 0
    def bundle_id(match):
        nonlocal index
        value = [APP_ID, EXTENSION_ID][index]
        index += 1
        return '"PRODUCT_BUNDLE_IDENTIFIER": "' + value + '"'
    text = re.sub(r'"PRODUCT_BUNDLE_IDENTIFIER": "[^"]+"', bundle_id, text)
    text, count = re.subn(r'"MARKETING_VERSION": "[^"]+"', '"MARKETING_VERSION": "' + WRAPPER_VERSION + '"', text)
    if count != 2:
        raise RuntimeError('Expected version settings for both app and extension.')
    text = re.sub(r'"CURRENT_PROJECT_VERSION": "[^"]+"', '"CURRENT_PROJECT_VERSION": "' + WRAPPER_BUILD + '"', text)
    project.write_text(text)
    app = project_root / 'PolicyWatcher'
    extension = project_root / 'PolicyWatcher Extension'
    shutil.copyfile(ROOT / 'browser-extension/apple/native/ViewController.swift', app / 'ViewController.swift')
    shutil.copyfile(ROOT / 'browser-extension/apple/native/SafariWebExtensionHandler.swift', extension / 'SafariWebExtensionHandler.swift')
    shutil.copyfile(ROOT / 'browser-extension/apple/container/Main.html', app / 'Resources/Base.lproj/Main.html')
    shutil.copyfile(ROOT / 'browser-extension/apple/container/Style.css', app / 'Resources/Style.css')
    # Use the existing official square mark, never a generated placeholder or third-party icon.
    run(['/usr/bin/sips', '-s', 'format', 'png', str(ROOT / 'public/press-kit/policywatcher-logo-square-1024.jpg'),
         '--out', str(app / 'Assets.xcassets/AppIcon.appiconset/universal-icon-1024@1x.png')], logs / 'app-icon.log')
    shutil.copyfile(ROOT / 'browser-extension/icons/icon-128.png', app / 'Resources/Icon.png')
    resources = extension / 'Resources'
    actual = sorted(str(f.relative_to(resources)) for f in resources.rglob('*') if f.is_file())
    if actual != sorted(RUNTIME):
        raise RuntimeError('Unexpected source/documents in extension resources.')
    for name in RUNTIME:
        if digest(resources / name) != digest(ROOT / 'browser-extension' / name):
            raise RuntimeError('Generated Safari runtime differs from reviewed shared source.')
    builds = {}
    base = ['xcodebuild', '-project', str(project_root / 'PolicyWatcher.xcodeproj'), '-scheme', 'PolicyWatcher',
            '-configuration', 'Release', '-jobs', '2', 'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO']
    if args.build in ['simulator', 'all']:
        derived = output / 'derived-simulator'
        run(base + ['-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator',
                    '-derivedDataPath', str(derived), 'build'], logs / 'build-simulator.log')
        builds['simulator'] = {'status': 'built_unsigned', 'app': str((derived / 'Build/Products/Release-iphonesimulator/PolicyWatcher.app').relative_to(output))}
    if args.build in ['device', 'all']:
        archive = output / 'PolicyWatcher-Safari-0.1.0-build1-unsigned.xcarchive'
        run(base + ['-sdk', 'iphoneos', '-destination', 'generic/platform=iOS', '-archivePath', str(archive),
                    '-derivedDataPath', str(output / 'derived-device'), 'archive'], logs / 'archive-device.log')
        builds['device'] = {'status': 'archived_unsigned_not_installable', 'archive': archive.name}
    bundle_checks = []
    for flavor, bundle in [
        ('simulator', output / 'derived-simulator/Build/Products/Release-iphonesimulator/PolicyWatcher.app'),
        ('device', output / 'PolicyWatcher-Safari-0.1.0-build1-unsigned.xcarchive/Products/Applications/PolicyWatcher.app'),
    ]:
        if flavor not in builds:
            continue
        app_info = plistlib.loads((bundle / 'Info.plist').read_bytes())
        extensions = list((bundle / 'PlugIns').glob('*.appex'))
        if len(extensions) != 1:
            raise RuntimeError('Expected exactly one embedded Safari extension.')
        embedded = extensions[0]
        ext_info = plistlib.loads((embedded / 'Info.plist').read_bytes())
        if app_info['CFBundleIdentifier'] != APP_ID or ext_info['CFBundleIdentifier'] != EXTENSION_ID:
            raise RuntimeError('Built bundle identifiers do not match reviewed identifiers.')
        for info in [app_info, ext_info]:
            if info['CFBundleShortVersionString'] != WRAPPER_VERSION or info['CFBundleVersion'] != WRAPPER_BUILD:
                raise RuntimeError('Built wrapper version/build mismatch.')
        for name in RUNTIME:
            if digest(embedded / name) != digest(ROOT / 'browser-extension' / name):
                raise RuntimeError('Built Safari runtime differs from reviewed shared source.')
        if (embedded / 'docs').exists() or any((b / '_CodeSignature').exists() or (b / 'embedded.mobileprovision').exists() for b in [bundle, embedded]):
            raise RuntimeError('Unexpected documentation, signature or provisioning in unsigned output.')
        architectures = subprocess.check_output(['lipo', '-archs', str(bundle / app_info['CFBundleExecutable'])], text=True).strip().split()
        bundle_checks.append({'target': flavor, 'appMinimumOS': app_info['MinimumOSVersion'],
                              'extensionMinimumOS': ext_info['MinimumOSVersion'], 'architectures': architectures,
                              'runtimeHashesMatched': len(RUNTIME), 'noDocumentationOrSigningMaterial': True,
                              'executableSha256': digest(bundle / app_info['CFBundleExecutable'])})
    source_zip = output / 'PolicyWatcher-Safari-iOS-0.1.0-build1-source.zip'
    with zipfile.ZipFile(source_zip, 'x', compression=zipfile.ZIP_DEFLATED) as package:
        for f in sorted((output / 'apple-project').rglob('*')):
            if f.is_file():
                package.write(f, f.relative_to(output))
    evidence = {'createdAt': datetime.now(timezone.utc).isoformat(), 'sourceRevision': revision,
                'sharedExtensionVersion': manifest['version'], 'wrapperVersion': WRAPPER_VERSION,
                'wrapperBuild': WRAPPER_BUILD, 'appBundleIdentifier': APP_ID, 'extensionBundleIdentifier': EXTENSION_ID,
                'distribution': 'local_unsigned_preview', 'signed': False, 'uploadedToApple': False,
                'minimumContainerIos': '17.0', 'builds': builds, 'bundleChecks': bundle_checks,
                'runtimeFiles': {name: digest(ROOT / 'browser-extension' / name) for name in RUNTIME},
                'packagerLogSha256': digest(logs / 'apple-packager.log'),
                'sourceProjectZip': {'file': source_zip.name, 'sha256': digest(source_zip)},
                'functionalSafariTest': 'not_executed', 'physicalDeviceTest': 'not_executed',
                'publicationBoundary': 'No production or Engine 6 deployment changes; no source approval or scans.'}
    (output / 'receipt.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
