# PolicyWatcher 4 Beta 2 traduce gli assessment indipendenti in controlli di produzione

Stato di pubblicazione: follow-up della release. Tag sorgente immutabile e
deployment in produzione verificati il 20 agosto 2026.

20 agosto 2026 — PolicyWatcher ha promosso `4.0.0-beta.2`, la release Production
Readiness Hardening della Foundation v4. L’aggiornamento applica i
rilievi materiali emersi da tre revisioni esterne senza modificare gli ID
pubblici stabili, la tassonomia o il contratto di publication readiness
introdotti con Beta 1.

Beta 2 rafforza disponibilità e integrità operativa: negli ambienti
gestiti l’identità client attendibile ora fallisce in modo chiuso; gli input
delle fonti e dell’AI sono limitati; le scansioni complete hanno un lease
durevole e rinnovabile; gli export cifrati coprono tutte le 31 tabelle
applicative; la readiness SQLite richiede WAL e un busy timeout di cinque
secondi; le nuove iscrizioni, o quelle riattivate, richiedono una conferma email
esplicita entro 48 ore.

Sono inoltre separati i segreti di firma Admin e Investor, è disponibile la
revoca globale delle sessioni Admin, tutte le pagine HTML amministrative sono
protette, il ruolo auditor è realmente in sola lettura, è presente una
liveness pubblica minimale e gli errori di acquisizione non vengono più
confusi con uno stato di evidenza vuoto.

L’artefatto esatto ha superato `11/11` controlli di staging prima della
promozione con checksum invariato. Il manifest live riporta Beta 2, il
comportamento di sovrascrittura del proxy è verificato e la database readiness
riporta tutte le 31 tabelle e 16 migrazioni con integrità SQLite `ok`, WAL e
busy timeout di cinque secondi. La ricevuta SMTP, un test dinamico indipendente
e il completo allineamento CSP del livello hosting restano evidenze separate.
PostgreSQL, object storage, letture canoniche e capacità multi-tenant restano
gate distinti.

Evidenze tecniche:
`docs/audit-v4.0.0-beta.2-assessment-remediation.md`

Scheda release:
`docs/releases/policywatcher-4.0.0-beta.2-github-release.md`

Infografica dettagliata sul valore 3.x → 4:
`public/press-kit/policywatcher-v4-beta2-value-infographic-en-2026-08-20.png`
