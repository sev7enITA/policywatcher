# Operational snapshot for the PolicyWatcher paper

`operational-snapshot-2026-07-30.json` is the current dated, read-only aggregate
capture of the public PolicyWatcher APIs used in the Beta 21 paper revision.
`operational-snapshot-2026-07-11.json`, when retained locally, is a historical
snapshot and must not be substituted for the current paper table.

## Collection protocol

Run from the repository root:

```sh
node scripts/paper-operational-snapshot.mjs
```

When run from the minimal arXiv bundle, the same script writes to the bundle's
`data/` directory. Use `--output relative/path.json` to select a different
destination.

For the fixture-gate control, start the local application with its development
database and run:

```sh
node scripts/paper-operational-snapshot.mjs --local http://127.0.0.1:3000
```

The script reads only these unauthenticated endpoints:

- `/api/leaderboard`
- `/api/source-suspensions`
- `/api/changes?page=1&pageSize=50`
- `/api/companies`

It does not access the production database, administrative APIs, credentials,
subscriber data, raw policy text, or private check logs.

## Interpretation boundary

The snapshot measures the public operational state at a point in time:
configured inventory, records that passed the public-evidence gate, suspended
sources, retrieval-path inventory, and public change-record inventory. It is not
a benchmark for legal interpretation, semantic change-detection accuracy, or
model-generated analyses. Those questions require an independently annotated
corpus and a longitudinal protocol.

The 30 July snapshot also records that `/api/leaderboard` and `/api/companies`
use different company inclusion rules. The paper therefore reports both raw
counts and does not calculate a provider-level coverage percentage.
