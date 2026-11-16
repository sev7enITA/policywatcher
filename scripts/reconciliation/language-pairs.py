"""Pair archived observations using reciprocal sitemap alternates before path fallback."""
import argparse
import csv
import gzip
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlsplit

LANG_TAG = '{http://www.w3.org/1999/xhtml}link'
LOC = '{http://www.sitemaps.org/schemas/sitemap/0.9}loc'


def compare(inventory, sections, sitemap):
    declarations = {}
    for entry in ET.fromstring(sitemap):
        url = entry.findtext(LOC)
        links = {l.get('hreflang'): l.get('href') for l in entry.findall(LANG_TAG) if l.get('rel') == 'alternate'}
        if url and links.get('en') and links.get('it') and url in (links['en'], links['it']):
            declarations[url] = (links['en'], links['it'])

    headings = defaultdict(list)
    for row in sections:
        heading = ' '.join(row['heading'].split())
        if heading:
            headings[row['url']].append(heading)
    by_url = {r['url']: r for r in inventory}
    pairs = defaultdict(dict)
    methods = {}
    localized_paths = {}
    for en, it in sorted(set(declarations.values())):
        if declarations.get(en) != (en, it) or declarations.get(it) != (en, it):
            continue
        paths = {urlsplit(en).path, urlsplit(it).path}
        key = urlsplit(en).path
        for path in paths:
            localized_paths[path] = key
        methods[key] = 'reciprocal sitemap alternates'
        pairs[key] = {lang: by_url[url] for lang, url in [('en', en), ('it', it)] if url in by_url}
    for row in inventory:
        path = urlsplit(row['url']).path
        lang = row['requested_language']
        if lang in ('en', 'it') and path not in localized_paths:
            pairs[path][lang] = row
    for path, pair in sorted(pairs.items()):
        en, it = pair.get('en', {}), pair.get('it', {})
        a, b = headings[en.get('url')], headings[it.get('url')]
        if en.get('http') != '200' or it.get('http') != '200':
            state = 'Missing comparable 200 pair'
        elif not a or not b:
            state = 'Headings unavailable for comparison'
        else:
            state = ('Identical' if a == b else 'Different') + ' observed heading sequence'
        yield {'path': path, 'method': methods.get(path, 'same path'), 'en_url': en.get('url'), 'it_url': it.get('url'),
               'en_http': en.get('http'), 'it_http': it.get('http'), 'en_headings': len(a), 'it_headings': len(b), 'comparison': state}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for arg in ('inventory', 'sections', 'sitemap', 'output'):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    data = args.sitemap.read_bytes()
    if args.sitemap.suffix == '.gz':
        data = gzip.decompress(data)
    with args.inventory.open() as i, args.sections.open() as s, args.output.open('w', newline='') as out:
        rows = list(compare(list(csv.DictReader(i)), csv.DictReader(s), data))
        writer = csv.DictWriter(out, fieldnames=rows[0], lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)
