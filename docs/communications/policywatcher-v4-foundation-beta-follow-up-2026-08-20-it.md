# PolicyWatcher 4 Foundation Beta - post di follow-up

Gate di pubblicazione: pubblicare dopo il superamento di staging e verifica post-deploy dell artifact v4 Hostinger. Fino ad allora usare la variante dedicata alla prerelease GitHub.

## Post principale dopo il deployment web

PolicyWatcher 4 Foundation Beta e ora disponibile.

La release aggiunge una catena canonica per le evidenze nel monitoraggio delle policy:

Entity -> Document -> Version -> Change -> Provision

Cosa cambia in pratica:

- gli identificatori pubblici stabili conservano i riferimenti esterni indipendentemente dagli UUID interni del database;
- una tassonomia versionata parte da training AI, condivisione dati, retention, arbitrato, licenze sui contenuti e responsabilita;
- un unico contratto di publication readiness derivato dal database serve Admin, confronto competitivo interno e API pubblica;
- backfill controllato, riconciliazione deterministica e dual-write transazionale opt-in preparano la migrazione mentre le letture correnti restano invariate;
- la portabilita PostgreSQL e testata, mentre cutover del database e object storage restano decisioni di produzione separate.

La release e una foundation beta. Documenta controlli implementati ed evidenze di migrazione; non dichiara copertura esaustiva, validazione legale, correttezza analitica o cutover infrastrutturale completato.

Record della release:
https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1

Contratto publication readiness:
https://policywatcher.online/api/v1/publication-readiness

Infografica dettagliata v4:
https://policywatcher.online/press-kit/policywatcher-v4-foundation-beta-en-2026-08-20.png

#CivicTech #PolicyMonitoring #DataGovernance #AITransparency #OpenSource

## Variante GitHub prima del deployment web

PolicyWatcher 4 Foundation Beta e stata pubblicata come prerelease GitHub.

La release sorgente introduce il modello canonico Entity, Document, Version, Change e Provision, identificatori pubblici stabili, una tassonomia mirata delle clausole e un unico contratto di publication readiness derivato dal database.

L artifact Hostinger esatto deve ancora superare staging e verifica post-deploy. Il sito pubblico puo quindi continuare a indicare la release web precedente finche quel gate separato non e completato.

Release e asset con checksum verificato:
https://github.com/sev7enITA/policywatcher/releases/tag/v4.0.0-beta.1

#CivicTech #PolicyMonitoring #DataGovernance #AITransparency #OpenSource

## Primo commento

Materiali di supporto:

- Report funzionale e confronto 3.x: https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/policywatcher-v4-vs-v3-2026-08-20.html
- Modello canonico delle evidenze: https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-model.md
- Runbook di migrazione: https://github.com/sev7enITA/policywatcher/blob/main/docs/document-evidence-backfill-runbook.md
- Documentazione API pubblica: https://github.com/sev7enITA/policywatcher/blob/main/docs/public-api-v1.md

La tassonomia classifica linguaggio osservato nelle policy. Non stabilisce validita legale, applicabilita o conformita.
