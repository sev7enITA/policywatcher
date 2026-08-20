# PolicyWatcher sitemap ER – agosto 2026

Il modello separa l’esperienza globale dai sette domini informativi. Le **34 route statiche** provengono direttamente da `src/app/sitemap.ts`; le quattro famiglie dinamiche descrivono entità indicizzate solo quando superano i rispettivi gate pubblici.

## Grafo ER

```mermaid
erDiagram
  EXPERIENCE {
    string product "PolicyWatcher"
    string region "Global context"
    string language "EN or IT"
    string workspace "Intent + depth"
  }
  STATIC_ROUTE {
    string pathname
    string change_frequency
    float priority
  }
  DYNAMIC_FAMILY {
    string route_pattern
    string entity_type
    string evidence_gate
  }
  DOMAIN_monitor {
    string id "monitor"
    string label "Monitor"
    int static_routes "5"
    string relationship "ORIENTA"
  }
  DOMAIN_evidence {
    string id "evidence"
    string label "Evidence"
    int static_routes "2"
    string relationship "PUBBLICA"
  }
  DOMAIN_civic {
    string id "civic"
    string label "Civic"
    int static_routes "2"
    string relationship "ORIENTA"
  }
  DOMAIN_trust_method {
    string id "trust-method"
    string label "Trust & Method"
    int static_routes "6"
    string relationship "VERIFICA"
  }
  DOMAIN_build_integrate {
    string id "build-integrate"
    string label "Build & Integrate"
    int static_routes "5"
    string relationship "PUBBLICA"
  }
  DOMAIN_communicate {
    string id "communicate"
    string label "Communicate"
    int static_routes "8"
    string relationship "PUBBLICA"
  }
  DOMAIN_understand {
    string id "understand"
    string label "Understand"
    int static_routes "6"
    string relationship "SPIEGA"
  }
  EXPERIENCE ||--o{ DOMAIN_monitor : "ORIENTA"
  EXPERIENCE ||--o{ DOMAIN_evidence : "PUBBLICA"
  EXPERIENCE ||--o{ DOMAIN_civic : "ORIENTA"
  EXPERIENCE ||--o{ DOMAIN_trust_method : "VERIFICA"
  EXPERIENCE ||--o{ DOMAIN_build_integrate : "PUBBLICA"
  EXPERIENCE ||--o{ DOMAIN_communicate : "PUBBLICA"
  EXPERIENCE ||--o{ DOMAIN_understand : "SPIEGA"
  EXPERIENCE ||--o{ STATIC_ROUTE : "espone 34 entry"
  EXPERIENCE ||--o{ DYNAMIC_FAMILY : "indicizza 4 famiglie"
  STATIC_ROUTE }o--|| DYNAMIC_FAMILY : "conduce a"
```

## Domini e route

### Monitor

Relazione con l’esperienza: **ORIENTA**.

- `/`
- `/observatory`
- `/timeline`
- `/what-changed`
- `/leaderboard`

### Evidence

Relazione con l’esperienza: **PUBBLICA**.

- `/evidence`
- `/collections`

### Civic

Relazione con l’esperienza: **ORIENTA**.

- `/en/associations`
- `/it/associazioni`

### Trust & Method

Relazione con l’esperienza: **VERIFICA**.

- `/trust`
- `/trust/residency`
- `/methodology/confidence`
- `/security`
- `/privacy`
- `/terms`

### Build & Integrate

Relazione con l’esperienza: **PUBBLICA**.

- `/developers`
- `/developers/event-continuity`
- `/developers/webhook-readiness`
- `/integrations`
- `/browser-extension`

### Communicate

Relazione con l’esperienza: **PUBBLICA**.

- `/press`
- `/press-kit`
- `/pulse`
- `/press-kit/releases`
- `/press-kit/data`
- `/press-kit/reference`
- `/press-kit/corrections`
- `/press-kit/glossary`

### Understand

Relazione con l’esperienza: **SPIEGA**.

- `/showcase`
- `/atlas`
- `/feature-atlas`
- `/infographics`
- `/roadmap`
- `/about`

## Famiglie dinamiche

| Famiglia | Pattern | Entità | Dominio |
| --- | --- | --- | --- |
| change | `/change/{changeId}` | PolicyChange | Monitor |
| knowledge | `/knowledge → /companies/{slug} → /policies/{policyId}` | Company + Policy | Evidence |
| release | `/press-kit/releases/{slug}` | PressRelease | Communicate |
| pulse | `/pulse/{slug}` | PulseStory | Communicate |

## Asset editoriale

- PNG sorgente: `public/infographics/policywatcher-experience-map-er-sitemap-2026-08.png`
- WebP ottimizzato: `public/infographics/policywatcher-experience-map-er-sitemap-2026-08.webp`

Il poster rappresenta l’architettura editoriale; il file Mermaid e l’inventario JSON restano la fonte esatta per route e relazioni.
