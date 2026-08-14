import type { PulseLocale, PulseStory } from './editorialPulse';
import { buildPulseManifest } from './editorialPulse';

const encoder = new TextEncoder();

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildStoryPackFiles(story: PulseStory, locale: PulseLocale): Array<{ name: string; content: string }> {
  const manifest = buildPulseManifest(story, locale);
  const sources = story.sourceLinks.map((source) => ({
    href: source.href,
    label: source.label[locale],
    claimId: source.claimId ?? null,
    releaseSlug: source.releaseSlug ?? null,
  }));
  const factsCsv = [
    ['id', 'value', 'label', 'detail', 'claim_id', 'proof_href'].map(csvCell).join(','),
    ...story.facts.map((fact) => [fact.id, fact.value, fact.label[locale], fact.detail[locale], fact.claimId, fact.proofHref].map(csvCell).join(',')),
  ].join('\n') + '\n';
  const readme = [
    'PolicyWatcher Editorial Story Pack',
    `Story: ${story.headline[locale]}`,
    `Version: ${story.version}`,
    `As of: ${story.asOf}`,
    `Status: ${story.status}`,
    '',
    story.deck[locale],
    '',
    `Boundary: ${story.boundary[locale]}`,
    '',
    'Verify the live sources before later publication. AI-assisted assessments are not legal advice.',
  ].join('\n') + '\n';
  const pitch = [story.headline[locale], '', story.deck[locale], '', story.whyItMatters[locale], '', `Boundary: ${story.boundary[locale]}`].join('\n') + '\n';

  return [
    { name: 'README.txt', content: readme },
    { name: 'citation.txt', content: `${story.citation[locale]}\n` },
    { name: 'facts.csv', content: factsCsv },
    { name: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'pitch.txt', content: pitch },
    { name: 'sources.json', content: `${JSON.stringify(sources, null, 2)}\n` },
  ];
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function joinBytes(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

/** Builds a deterministic, uncompressed ZIP. Stable order and DOS timestamp make byte output reproducible. */
export function buildDeterministicStoryZip(story: PulseStory, locale: PulseLocale): Uint8Array {
  const entries = buildStoryPackFiles(story, locale).sort((a, b) => a.name.localeCompare(b.name));
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  // 2026-07-29 12:00:00, encoded once instead of using the runtime clock.
  const dosTime = (12 << 11);
  const dosDate = ((2026 - 1980) << 9) | (7 << 5) | 29;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.byteLength + data.byteLength);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 6, 0x0800);
    writeU16(localView, 8, 0);
    writeU16(localView, 10, dosTime);
    writeU16(localView, 12, dosDate);
    writeU32(localView, 14, checksum);
    writeU32(localView, 18, data.byteLength);
    writeU32(localView, 22, data.byteLength);
    writeU16(localView, 26, name.byteLength);
    writeU16(localView, 28, 0);
    local.set(name, 30);
    local.set(data, 30 + name.byteLength);
    localParts.push(local);

    const central = new Uint8Array(46 + name.byteLength);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014b50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 20);
    writeU16(centralView, 8, 0x0800);
    writeU16(centralView, 10, 0);
    writeU16(centralView, 12, dosTime);
    writeU16(centralView, 14, dosDate);
    writeU32(centralView, 16, checksum);
    writeU32(centralView, 20, data.byteLength);
    writeU32(centralView, 24, data.byteLength);
    writeU16(centralView, 28, name.byteLength);
    writeU16(centralView, 30, 0);
    writeU16(centralView, 32, 0);
    writeU16(centralView, 34, 0);
    writeU16(centralView, 36, 0);
    writeU32(centralView, 38, 0);
    writeU32(centralView, 42, localOffset);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.byteLength;
  }

  const central = joinBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeU32(endView, 0, 0x06054b50);
  writeU16(endView, 4, 0);
  writeU16(endView, 6, 0);
  writeU16(endView, 8, entries.length);
  writeU16(endView, 10, entries.length);
  writeU32(endView, 12, central.byteLength);
  writeU32(endView, 16, localOffset);
  writeU16(endView, 20, 0);
  return joinBytes([...localParts, central, end]);
}
