#!/usr/bin/env python3
"""Offline checks on draft Apple metadata. Does not submit or approve it."""
import json
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parent.parent
kit = root / 'browser-extension/apple/submission'
rows = []
for locale in ['en', 'it']:
    data = json.loads((kit / ('metadata-' + locale + '.json')).read_text())
    assert data['locale'] == locale
    assert data['state'] == 'draft_for_publisher_review_not_submitted'
    assert data['appStoreAvailability'] == 'not_available' and data['testFlightAvailability'] == 'not_uploaded'
    assert data['version'] == '0.1.0' and data['build'] == '1'
    assert data['bundleIdentifier'] == 'online.policywatcher.safari'
    assert data['extensionBundleIdentifier'] == 'online.policywatcher.safari.Extension'
    for field, limit in [('name', 30), ('subtitle', 30), ('promotionalText', 170), ('description', 4000)]:
        assert 0 < len(data[field]) <= limit, (locale, field)
    assert len(data['keywords'].encode('utf8')) <= 100
    assert all(len(word.strip()) > 2 for word in data['keywords'].split(','))
    assert data['description'] == (kit / ('description-' + locale + '.txt')).read_text().strip()
    for field in ['supportUrl', 'privacyUrl', 'marketingUrl']:
        url = urlsplit(data[field])
        assert url.scheme == 'https' and url.netloc == 'policywatcher.online'
    for prefix in ['testflight-', 'review-notes-']:
        suffix = '.txt' if prefix == 'testflight-' else '.md'
        assert (kit / (prefix + locale + suffix)).is_file()
    rows.append({'locale': locale, 'metadataFieldsChecked': 8, 'keywordUtf8Bytes': len(data['keywords'].encode('utf8'))})
for name in ['README.md', 'privacy-answers.md', 'signing-and-upload.md', 'screenshots.md', 'qa-matrix.csv', 'synthetic-notice.html', 'publisher-fields.json', 'compatibility-review.md']:
    assert (kit / name).is_file(), name
print(json.dumps({'status': 'draft_metadata_validated_offline_not_submitted', 'locales': rows}, indent=2))
