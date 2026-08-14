-- Reproducible extraction of every reviewed row used by the portable report.
-- Run from the PolicyWatcher repository root with SQLite 3 + JSON1:
--   sqlite3 -json < docs/reports/policywatcher-state-of-art-audit-2026-08-14.sql
--
-- The artifact JSON is canonical. Each result row contains the dataset name
-- and the exact JSON object rendered by the report's cards, chart, or tables.

WITH artifact AS (
  SELECT CAST(readfile(
    'docs/reports/policywatcher-state-of-art-audit-2026-08-14.artifact.json'
  ) AS TEXT) AS document
),
dataset_names(dataset) AS (
  VALUES
    ('headline_metrics'),
    ('maturity_chart'),
    ('maturity'),
    ('dependencies'),
    ('target_architecture'),
    ('asia_watchlist'),
    ('community_signals'),
    ('roadmap'),
    ('evaluation_contract')
)
SELECT
  dataset_names.dataset,
  json(rows.value) AS row_json
FROM artifact
CROSS JOIN dataset_names
CROSS JOIN json_each(
  artifact.document,
  '$.snapshot.datasets.' || dataset_names.dataset
) AS rows
ORDER BY dataset_names.dataset, rows.key;
