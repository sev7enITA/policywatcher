# PolicyWatcher Android Companion

An Expo SDK 57 / React Native companion for reading already-published PolicyWatcher evidence on Android, keeping a small local watchlist and collection, and handing review to the canonical web workspace.

## Requirements

- Node.js 22+
- npm 10+
- Android Studio with an Android emulator or a connected device
- Java 17 for local Android builds

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

This is a polling companion for public publication events. It is not background source monitoring, remote push delivery, an authenticated admin client, or a legal/compliance verdict. When the public feed cannot be reached, the app uses the last good device cache; without a cache it shows clearly labelled deterministic demonstration records.
