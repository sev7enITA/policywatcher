# SoftwareX submission package

This directory contains a SoftwareX Original Software Publication prepared from
the journal's official LaTeX structure.

## Primary files

- `policywatcher-softwarex.tex`: complete manuscript source.
- `figures/architecture.pdf`: original vector architecture figure.
- `figures/illustrative-workflow.pdf`: original vector workflow figure.
- `build_figures.py`: deterministic source for both figures and the optional
  graphical abstract.
- `submission/`: editable highlights, cover letter, declarations, graphical
  abstract, supplementary-data notes, and the submission checklist.

The operational JSON cited in Table 2 is stored at
`../data/operational-snapshot-2026-07-11.json`. Its collection script is
`../../../scripts/paper-operational-snapshot.mjs` from this directory.

## Build

Generate vector figures and compile the manuscript from the repository root:

```sh
python3 docs/paper/softwarex/build_figures.py
tectonic --outdir docs/paper/softwarex/build \
  docs/paper/softwarex/policywatcher-softwarex.tex
```

Run `scripts/package-softwarex-source.sh` to create the submission files in
`output/pdf/` and `output/softwarex/`.

## License

PolicyWatcher software is MIT-licensed. The manuscript, original figures, and
supplementary research material are licensed under CC BY 4.0.
