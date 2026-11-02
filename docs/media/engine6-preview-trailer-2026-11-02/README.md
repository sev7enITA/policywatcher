# PolicyWatcher | Evidence in Motion

Completed local trailer, 2 November 2026. Not publicly published.

180 seconds, 1920×1080, 30 fps, H.264 with AAC stereo at 48 kHz. English female narration generated locally by MakeMyVoice; visual animation authored in Claude Motion. Fabrizio approved the 30-second voice direction and asked that it be retained.

## Deliverables

Working media are retained outside Git in output/engine6-preview-trailer-2026-11-02/.

- export/policywatcher-engine6-preview-trailer-180s-1080p.mp4: final voiced master, with selectable English captions.
- export/policywatcher-evidence-in-motion-source.zip: complete private editable project, assets, fonts, supplied audio and cue data.
- export/policywatcher-evidence-in-motion-en.srt: 49 English caption cues, at least 1.2 seconds each and at most two lines.
- audio/policywatcher-makemyvoice-narration-180s.wav: 180-second original narration master.
- export/contact-sheet.jpg: ten inspected final-video keyframes.

Private Motion project: https://claude.ai/artifact/61Yoe6dP6fFJnovJ3mCn7G

Motion's editable player and its video export are silent. The delivered MP4 combines its frozen visual export with the original MakeMyVoice WAV locally, without re-encoding the video or changing the audio timeline. The source ZIP includes the offline project; motion-modules/ retains the authored scene modules in Git and requires the Motion runtime.

## Source of truth and factual boundaries

- Public research diary: https://policywatcher.online/engine-6-preview
- Source repository: https://github.com/sev7enITA/policywatcher
- Publication evidence: docs/reports/policywatcher-5.5.0-publication-2026-11-02.md
- Official assets: public/press-kit and public/engine-6-preview.

Product 5.5 is the public stable service. Engine 6 is a private administrative Preview with separate data within the current hosting account. Its automatic public changes and notifications remain disabled. Compare runs two extractors on the same captured response. Source completeness, observations across days, and real-scale operation remain qualification tracks. 500 policies per day is a target, not an achieved production qualification. Test totals are not combined into an accuracy claim. Illustrative clauses are labelled, and hashes in diagrams are examples.

## Narration and checks

MakeMyVoice used its existing isolated MLX-Audio 0.5.3 runtime, pinned Qwen3-TTS VoiceDesign revision f90d617701d9f7f4ca499291e0b57f2b3c2fd2ee for the original narrator, and Base revision e7dd0585652209fa0d7783659aad4e8a324de11c to keep that newly generated synthetic voice across the ten scenes. No personal voice reference or game recording was used, and no approved owner preset was changed.

Ten scene transcripts were checked using a separate local speech recogniser and manually compared to the intended script. Only equivalent spelling and number formats appeared. The narration fits without time stretching. The user's approval concerns the voice direction; no automated metric establishes subjective naturalness.

Final checks passed: 180.000 seconds, 5400 frames, 1920×1080 at 30 fps, AAC audio present, all ten scene audio correlations above 0.9999 at their authored positions. All three QR codes decoded from the final MP4 at 166, 170, 175 and 179 seconds. Ten scene keyframes were visually inspected. See production-verification.json, asset-manifest.json and verify_export.py.

The first silent export is preserved locally as motion-export-v1.mp4. The final visual export includes later layout corrections and is retained separately.

## Brand and source provenance

Official logo artwork was not redrawn. Motion cropped transparent margins and removed the flat navy wordmark background for compositing. The original diagrams were converted to WebP for display; animated simplified diagrams retain the source relationships. QR PNGs and the MakeMyVoice MP3 inside the source ZIP were verified byte-identical to the supplied files.

Credit: PolicyWatcher / Fabrizio Degni. Original synthetic narration: MakeMyVoice. Animation: Claude Motion.
