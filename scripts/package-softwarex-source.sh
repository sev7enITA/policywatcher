#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
paper_dir="$repository_root/docs/paper/softwarex"
build_dir="$paper_dir/build"
pdf_output_dir="$repository_root/output/pdf"
package_output_dir="$repository_root/output/softwarex"
staging_dir="$(mktemp -d)"
figure_python="${SOFTWAREX_FIGURE_PYTHON:-python3}"
tectonic_bin="${TECTONIC_BIN:-$(command -v tectonic)}"

cleanup() {
  rm -rf "$staging_dir"
}
trap cleanup EXIT

if "$figure_python" -c 'import reportlab' >/dev/null 2>&1; then
  "$figure_python" "$paper_dir/build_figures.py"
else
  printf 'ReportLab is unavailable; using the supplied vector figure PDFs.\n'
fi

if [[ -z "$tectonic_bin" ]]; then
  printf 'Error: tectonic was not found. Set TECTONIC_BIN explicitly.\n' >&2
  exit 1
fi
"$tectonic_bin" --outdir "$build_dir" "$paper_dir/policywatcher-softwarex.tex"

mkdir -p "$pdf_output_dir" "$package_output_dir"
cp "$build_dir/policywatcher-softwarex.pdf" "$pdf_output_dir/PolicyWatcher-SoftwareX.pdf"

source_root="$staging_dir/PolicyWatcher-SoftwareX-LaTeX-source"
mkdir -p "$source_root/figures" "$source_root/Supplementary-Data"
cp "$paper_dir/policywatcher-softwarex.tex" "$source_root/"
cp "$paper_dir/build_figures.py" "$source_root/"
cp "$paper_dir/figures/architecture.pdf" "$source_root/figures/"
cp "$paper_dir/figures/illustrative-workflow.pdf" "$source_root/figures/"
cp "$paper_dir/submission/LaTeX_source_README.txt" "$source_root/00README.txt"
cp "$paper_dir/submission/Supplementary_data_README.md" "$source_root/Supplementary-Data/README.md"
cp "$repository_root/docs/paper/data/operational-snapshot-2026-07-11.json" "$source_root/Supplementary-Data/"
cp "$repository_root/scripts/paper-operational-snapshot.mjs" "$source_root/Supplementary-Data/"

(cd "$staging_dir" && zip -q -r "$package_output_dir/PolicyWatcher-SoftwareX-LaTeX-source.zip" "PolicyWatcher-SoftwareX-LaTeX-source")

bundle_root="$staging_dir/PolicyWatcher-SoftwareX-submission-ready"
mkdir -p "$bundle_root"
cp "$pdf_output_dir/PolicyWatcher-SoftwareX.pdf" "$bundle_root/01-Manuscript.pdf"
cp "$package_output_dir/PolicyWatcher-SoftwareX-LaTeX-source.zip" "$bundle_root/02-LaTeX-source.zip"
cp "$paper_dir/submission/Highlights.txt" "$bundle_root/03-Highlights.txt"
cp "$paper_dir/submission/graphical-abstract.pdf" "$bundle_root/04-Graphical-abstract.pdf"
cp "$paper_dir/submission/Cover_letter.docx" "$bundle_root/05-Cover-letter.docx"
cp "$paper_dir/submission/Competing_interests_declaration.docx" "$bundle_root/06-Competing-interests.docx"
cp "$paper_dir/submission/CRediT_author_statement.txt" "$bundle_root/07-CRediT-author-statement.txt"
cp "$paper_dir/submission/Data_availability_statement.txt" "$bundle_root/08-Data-availability-statement.txt"
cp "$repository_root/docs/paper/data/operational-snapshot-2026-07-11.json" "$bundle_root/09-Supplementary-data.json"
cp "$paper_dir/submission/Supplementary_data_README.md" "$bundle_root/10-Supplementary-data-README.md"
cp "$paper_dir/submission/Submission_checklist.md" "$bundle_root/11-Submission-checklist.md"

(cd "$staging_dir" && zip -q -r "$package_output_dir/PolicyWatcher-SoftwareX-submission-ready.zip" "PolicyWatcher-SoftwareX-submission-ready")

shasum -a 256 \
  "$pdf_output_dir/PolicyWatcher-SoftwareX.pdf" \
  "$package_output_dir/PolicyWatcher-SoftwareX-LaTeX-source.zip" \
  "$package_output_dir/PolicyWatcher-SoftwareX-submission-ready.zip" \
  > "$package_output_dir/SHA256SUMS.txt"

printf 'Created:\n'
printf '  %s\n' "$pdf_output_dir/PolicyWatcher-SoftwareX.pdf"
printf '  %s\n' "$package_output_dir/PolicyWatcher-SoftwareX-LaTeX-source.zip"
printf '  %s\n' "$package_output_dir/PolicyWatcher-SoftwareX-submission-ready.zip"
