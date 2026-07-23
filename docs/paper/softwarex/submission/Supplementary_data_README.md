# PolicyWatcher operational snapshot

This supplement supports Table 2 of the SoftwareX manuscript. It contains a
dated JSON record collected at `2026-07-11T21:33:25.966Z` from unauthenticated,
read-only PolicyWatcher endpoints, plus a fixture-only local control.

## Files

- `operational-snapshot-2026-07-11.json`: the immutable snapshot used for the
  counts reported in the manuscript.
- `paper-operational-snapshot.mjs`: the collection script. It reads only public
  JSON endpoints; it does not access the database, administrative APIs,
  credentials, subscribers, or raw policy text.

## Interpretation

The production part records configured coverage, public-evidence admission,
suspension notices, retrieval-path inventory, and public change-record counts.
The local control contains seeded fixtures with no retrieved evidence and
therefore verifies that the same public APIs expose no policy or change content.

These data are operational observations. They do not measure the semantic or
legal accuracy of a detected change, the correctness of model-generated
analysis, or broad external adoption. Public endpoints can change after the
recorded collection time; reproducibility of Table 2 therefore depends on the
included snapshot rather than a later live query.

## Recollection

From the repository root, a later public snapshot can be created with:

```sh
node scripts/paper-operational-snapshot.mjs --output path/to/output.json
```

Adding `--local http://127.0.0.1:3000` captures a running local fixture control
in the same output. A later query is a new observation and must not overwrite
the dated file used by the manuscript.

## License

This supplementary material is licensed under CC BY 4.0. PolicyWatcher source
code is licensed separately under the MIT License.
