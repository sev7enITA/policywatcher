import { describe, expect, it } from 'vitest';
import { COPY } from '../src/i18n/copy';

describe('companion content voice', () => {
  it('uses direct, parallel Italian and English headings', () => {
    expect(COPY.it.masthead.product).toBe('PolicyWatcher companion');
    expect(COPY.en.masthead.product).toBe('PolicyWatcher Companion');
    expect(COPY.it.today.title).toBe('Aggiornamenti');
    expect(COPY.en.today.title).toBe('Updates');
    expect(COPY.it.tabs).toEqual({ today: 'Feed', watchlist: 'Aziende', collection: 'Salvati', companion: 'Impostazioni' });
    expect(COPY.en.tabs).toEqual({ today: 'Feed', watchlist: 'Companies', collection: 'Saved', companion: 'Settings' });
    expect(COPY.it.explainer.title).toBe('Feed ed elementi salvati');
    expect(COPY.en.explainer.title).toBe('Feed and saved items');
    expect(COPY.it.watchlist.title).toBe('Aziende osservate');
    expect(COPY.en.watchlist.title).toBe('Watched companies');
    expect(COPY.it.collection.title).toBe('Elementi salvati');
    expect(COPY.en.collection.title).toBe('Saved items');
    expect(COPY.it.companion.title).toBe('Impostazioni');
    expect(COPY.en.companion.title).toBe('Settings');
    expect(COPY.it.detail.publication).toBe('DETTAGLI PUBBLICAZIONE');
    expect(COPY.en.detail.publication).toBe('PUBLICATION DETAILS');
    expect(COPY.it.companion.pollingTitle).toBe('Aggiornamento del feed');
    expect(COPY.en.companion.pollingTitle).toBe('Feed updates');
    expect(COPY.it.companion.boundaryTitle).toBe('Limiti dello screening');
    expect(COPY.en.companion.boundaryTitle).toBe('Screening limitations');
  });

  it('states refresh, storage and sharing boundaries directly', () => {
    expect(COPY.it.masthead.polling).toBe('Aggiornamento su richiesta');
    expect(COPY.en.masthead.polling).toBe('Refresh on demand');
    expect(COPY.it.watchlist.localOnly).toBe('Salvata sul dispositivo');
    expect(COPY.en.watchlist.localOnly).toBe('Stored on this device');
    expect(COPY.it.companion.dataBody).toContain('solo gli identificativi pubblici');
    expect(COPY.en.companion.dataBody).toContain('public identifiers only');
  });

  it('keeps demonstration records factual and removes legacy slogans', () => {
    const content = JSON.stringify(COPY);
    expect(content).not.toMatch(/evidence to read, not alerts to chase/i);
    expect(content).not.toMatch(/evidenze da leggere, non notifiche da inseguire/i);
    const headings = [
      COPY.it.today.title,
      COPY.en.today.title,
      COPY.it.explainer.title,
      COPY.en.explainer.title,
      COPY.it.watchlist.title,
      COPY.en.watchlist.title,
      COPY.it.collection.title,
      COPY.en.collection.title,
      COPY.it.companion.title,
      COPY.en.companion.title,
      COPY.it.companion.boundaryTitle,
      COPY.en.companion.boundaryTitle,
    ].join('\n');
    expect(headings).not.toMatch(/\b(?:start|find|discover|explore|calm|clarity|confidence)\b/i);
    expect(headings).not.toMatch(/\b(?:parti|trova|scopri|esplora|fiducia|chiarezza)\b/i);
    expect(COPY.it.today.demoBody).toContain('dati dimostrativi');
    expect(COPY.en.today.demoBody).toContain('demonstration data');
  });
});
