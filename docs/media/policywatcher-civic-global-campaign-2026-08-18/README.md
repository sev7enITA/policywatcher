# PolicyWatcher Civic - English global campaign assets

## Deliverables

- General 5W infographic: `/public/infographics/policywatcher-civic-5w-global-directory-2026-08-18-v3.png` (`946 x 1663`)
- Technical infographic: `/public/infographics/policywatcher-civic-technical-coverage-2026-08-18-v3.png` (`897 x 1752`)
- Editorial posting workflow: `/public/infographics/policywatcher-civic-editorial-workflow-2026-08-18.png` (`1200 x 1500`) and editable SVG
- World coverage map: `/public/infographics/policywatcher-civic-world-coverage-map-2026-08-18.png` (`1200 x 1500`) and editable SVG
- Figma source: `https://www.figma.com/design/cRyvuCmnmbeilbi8Ss8mdR`
- Verbatim ImageGen prompts: [`final-prompts.txt`](./final-prompts.txt)
- Verbatim v3 footer-edit prompts: [`footer-localization-prompts.txt`](./footer-localization-prompts.txt)

SHA-256:

- 5W: `f826aabcf6b1bb7cbeefab9b758965ac9070dddb9d31df197a02c242f7c447fe`
- Technical: `22b772655e901e7127eb9747bd6fa80337cfd45e928b53293c68277b7fdfb706`
- Editorial workflow: `1c94299bd628b1cea8f8c246580a56fa7e75fb6b80edec64ba684fcdfd6b7498`
- World coverage map: `b891afba7c75557f576e299410f3d747477f160d056196336b416c17c326ce99`

Generation mode: built-in ImageGen, image-reference generation for the base infographics. The official PolicyWatcher lockup was then composited from the source PNG without redrawing, recoloring or changing its aspect ratio. Facts and language were supplied in the prompts; publication still requires editorial review.

The `v3` English assets replace only the footer destination with `policywatcher.online/en/associations`. Built-in ImageGen was used in text-localization edit mode, after which only the edited footer band was composited onto the approved `v2` file. All pixels above that band, including the official PolicyWatcher wordmark, remain from the approved source asset.

The editorial workflow and world coverage map are deterministic SVG/PNG renders generated with
`npm run assets:civic-campaign`. They read the current civic catalog directly; the map uses Natural Earth 110m
geometry through `world-atlas` with a Natural Earth 1 projection. The official PolicyWatcher wordmark is embedded
from the source PNG without redrawing. Country markers use approximate country centroids and do not represent
office addresses.

Reference files:

- `/public/press-kit/policywatcher-wordmark-dark-2400x600.png`
- `/public/infographics/policywatcher-experience-map-er-sitemap-2026-08.png`

Editorial language rule: use descriptive labels tied to a function, action or measurable interaction. Avoid slogans, hype and vague narrative terms.

The Figma Starter call limit was reached after the editable posting-workflow frame and four named campaign artboards were created. The Figma draft is not approved for publication because its first frame still contains earlier wording. Replace the current main headline with `Five posts, each focused on one function.`, rename the first card `5W overview` and use the phases `INTRODUCTION / COVERAGE / COUNTRY VIEW / CONTRIBUTION / METHOD`. The corrected PNGs remain ready for placement in the matching `02` and `03` artboards when the quota renews.
