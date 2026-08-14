# PolicyWatcher social shorts

Three standalone, looping vertical social shorts for PolicyWatcher 3.6.3.
They are designed for muted browser-frame capture at 1080 x 1920, with all
meaning carried by the on-screen English copy and the animated evidence flow.

## Files

- `index.html` - control room for selecting, pausing, restarting, and cycling the three shorts.
- `short-01-source-to-evidence.html` - configured source, retrieval outcome, baseline/hash, public evidence gate, and readable change signal.
- `short-02-adaptive-workspace.html` - four intent lanes, evidence depths, full desktop workspace, and user-selected mobile reading profile.
- `short-03-public-boundaries.html` - available/review/unavailable states, public evidence boundary, temporary suspension, and mobile notice.
- `styles.css` - shared 1080 x 1920 artboard, visual system, responsive preview scaling, and 21-second CSS sequences.
- `script.js` - artboard scaling, pause/restart, record mode, and control-room cycling.

The only bitmap brand asset used is `../../../public/logo-mark.png`.

## Preview

Open `index.html` in a modern browser for the control room. It uses an embedded
record-mode preview of the currently selected short. Each individual page also
works when opened directly, without a build step or dependency.

For a clean capture, open an individual clip with `?record=1`, for example:

```text
short-01-source-to-evidence.html?record=1
short-02-adaptive-workspace.html?record=1
short-03-public-boundaries.html?record=1
```

`record=1` hides playback controls and starts the same first 21-second loop.
Set the browser viewport to `1080 x 1920` before recording at 30 fps. The
artboard automatically scales when previewed in a narrower window; the primary
on-screen messages remain visible at a 390px-wide preview. Users who prefer
reduced motion see the fully assembled final state.

## Publishing copy (Italian)

**Short 01**
Fonte, percorso di recupero, stato e segnale di modifica: PolicyWatcher rende
ispezionabile il percorso dell'evidenza. Segui la fonte, non solo il riepilogo.

**Short 02**
PolicyWatcher parte dalla domanda: cittadino, GRC/legale, ricerca o sviluppo.
La modalita mobile di lettura e opzionale e viene selezionata dall'utente.

**Short 03**
Quando una fonte e incerta non diventa un fatto pubblico. Lo stato dell'evidenza
resta associato al segnale e le fonti sospese mostrano solo un avviso essenziale
finche non esiste una baseline verificata, un PDF ufficiale o una revisione
amministrativa tracciata.

## Accuracy boundary

The shorts describe configured public policy sources and recorded retrieval
outcomes. In the public-data gate, non-seeded records must be `Available` or
`Reviewed` and have public evidence before they can be public; configured,
partial, review-needed, unavailable, or otherwise unevidenced sources remain
temporarily suspended from public analysis. The clips do not make certification,
compliance, or absolute-accuracy claims.
