#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$repo_root/docs/paper/policywatcher-arxiv.tex"
snapshot_file="$repo_root/docs/paper/data/operational-snapshot-2026-07-30.json"
data_readme="$repo_root/docs/paper/data/README.md"
output_dir="$repo_root/output/arxiv"
archive="$output_dir/policywatcher-arxiv-beta21-source.zip"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/policywatcher-arxiv.XXXXXXXX")"

cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

if [[ ! -f "$source_file" ]]; then
  echo "Missing TeX source: $source_file" >&2
  exit 1
fi

if [[ ! -f "$snapshot_file" || ! -f "$data_readme" ]]; then
  echo "Missing Beta 21 operational snapshot or data README." >&2
  exit 1
fi

if ! command -v tectonic >/dev/null 2>&1; then
  echo "Tectonic is required to verify the isolated source build." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required to create the arXiv upload archive." >&2
  exit 1
fi

mkdir -p "$output_dir" "$work_dir/build" "$work_dir/data"
cp "$source_file" "$work_dir/policywatcher-arxiv.tex"
cp "$snapshot_file" "$work_dir/data/operational-snapshot-2026-07-30.json"
cp "$data_readme" "$work_dir/data/README.md"

# Compile from an isolated directory so accidental local figures, styles, or
# bibliography files cannot make the verification pass.
tectonic --keep-logs --outdir "$work_dir/build" "$work_dir/policywatcher-arxiv.tex"

# arXiv should receive the TeX source, never the locally generated PDF or build
# artifacts. Recreate the archive to prevent stale files from surviving.
rm -f "$archive"
(
  cd "$work_dir"
  zip -q "$archive" policywatcher-arxiv.tex \
    data/operational-snapshot-2026-07-30.json data/README.md
)

archive_entries="$(unzip -Z1 "$archive")"
expected_entries="$(printf '%s\n' \
  'policywatcher-arxiv.tex' \
  'data/operational-snapshot-2026-07-30.json' \
  'data/README.md')"
if [[ "$archive_entries" != "$expected_entries" ]]; then
  echo "Unexpected archive contents:" >&2
  echo "$archive_entries" >&2
  exit 1
fi

echo "Verified arXiv source archive: $archive"
echo "Contents: policywatcher-arxiv.tex, data/operational-snapshot-2026-07-30.json, data/README.md"
