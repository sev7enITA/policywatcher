# PolicyWatcher Android Companion

An Expo SDK 57 / React Native companion for reading already-published PolicyWatcher evidence on Android, following services, reviewing changes, recording personal choices and preparing support drafts on the device.

## Requirements

- Node.js 22+
- npm 10+
- Android Studio with an Android emulator or a connected device
- A JDK compatible with Gradle (local Android validation used Java 21)

No private credentials are required. The public origin defaults to `https://policywatcher.online`. To point a development build at another endpoint, set `EXPO_PUBLIC_POLICYWATCHER_ORIGIN`. Production-like values must use HTTPS; only `localhost`, `127.0.0.1` and the Android emulator host `10.0.2.2` may use HTTP during development.

## Run

```bash
npm install
npm run android
```

For a native development build:

```bash
npm run prebuild:android
npx expo run:android
```

The generated `android/` directory is intentionally ignored. Regenerate it from `app.json` rather than treating it as source.

## Validate

```bash
npm test
npm run typecheck
npm run lint
npm run export:web
```

The static design-evaluation build is written to `dist/index.html`. It uses browser local storage instead of SQLite KV; Android uses `expo-sqlite/kv-store`.

## Deep links

- Public record: `policywatcher://change/<change-uuid>`
- Collection: `policywatcher://collection?changes=<uuid>,<uuid>`

Inputs fail closed: change identifiers must be canonical UUID v4 values and collections are capped at 12 unique identifiers. Shared web URLs contain identifiers only; local titles and review status never enter the query string.

## Product boundary

This is a polling companion for public publication events. It is not background source monitoring, remote push delivery, an authenticated admin client, or a legal/compliance verdict. When the public feed cannot be reached, the app labels the last good device cache as needing a fresh check; without a cache it shows an unavailable state. It never inserts demonstration records into the operational journey.

## Citizen journey (2026-10-06)

The first tab now opens the citizen journey. Select services from the bounded public
catalog, add an optional country and plan locally, read a change and its official
source, listen to its public summary, record a personal review or reported action,
and prepare a support draft. Saved evidence collections and existing deep links
remain available from Settings.

- `GET /api/v1/citizen-feed` is a separate bounded public feed with source retrieval
  dates and an explicit older-history cursor. No service choices, country, plan,
  pasted notices or user notes are sent in feed requests.
- Preferences migrate from versions 1/2 to version 3 without dropping the 200-item
  watchlist or the existing evidence collection. Newly recorded actions remain
  user statements; the companion cannot verify their effect on a remote account.
- If saved preferences cannot be read, the original bytes are preserved. The
  Choices screen offers an explicit backup export and confirmed full reset; the
  reset explains that it also clears the legacy evidence collection.
- A later public event reopens a choice. Missing, dated or cached evidence leaves
  its current status unknown. Source retrieval dates are distinct from the date
  when the feed was downloaded. API failure never inserts demonstration records.
- Notice matching uses the downloaded metadata only. Input is not stored or sent
  and is cleared on leaving the screen. A match is not authentication of a notice.
- Guide review dates describe editorial review of public official instructions,
  not a test in the user's account. Guides are shared with the website.
- Speech starts only on request and stops when leaving the detail screen.
- Support text is previewed before export. Web downloads a file; Android opens the
  system share sheet for an explicitly requested temporary local `.txt` file.
  Nothing is sent automatically. Account credentials are never requested.
- Android automatic app backup is disabled in `app.json` (`android.allowBackup`),
  consistent with the companion’s lack of preference synchronization.
- There are no push notifications, background monitoring, account connections or
  cross-device synchronization. “Revisit next time” is a local list state.

### Validation

Run `npm ci --ignore-scripts`, `npm run test`, `npm run typecheck`, `npm run lint`,
and `npm run export:web` from this directory. The focused citizen tests cover
legacy migration, retained service names/plans, public-only requests, validation,
page deduplication and withdrawn catalog entries. Core rule tests live alongside
the shared website implementation.

The browser integration fixture exercises the actual Expo web export at a 390px
viewport: service follow, plan persistence, review, later-event reopening, offline
uncertainty, support download and paste privacy. It does not establish native
screen-reader, device speech, Android sharing or app-store delivery behavior.
Native builds require the Android SDK and a compatible JDK. Never infer an
installed release from a successful export or a generated native project.

Local validation on 2026-10-06 passed 18 unit tests, TypeScript, ESLint, Expo web
export, Android Hermes export and Gradle `:app:assembleDebug` (353 tasks). The
resulting APK is a development build and was not installed on a device. Browser
checks also covered 200% text, keyboard focus and recovery from corrupt local
preferences. Native speech, sharing and screen-reader behavior still need device
verification; no store distribution or backend deployment was performed.
