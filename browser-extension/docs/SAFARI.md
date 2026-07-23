# Safari packaging / Packaging Safari

Apple’s current tool is `safari-web-extension-packager` (formerly `safari-web-extension-converter`). From the repository root:

```bash
xcrun safari-web-extension-packager browser-extension \
  --project-location build/safari \
  --app-name "PolicyWatcher" \
  --bundle-identifier online.policywatcher.browser-extension \
  --swift
```

Review every compatibility warning printed by the packager. Then in Xcode:

1. Select the publisher’s Apple Developer Team for the app and extension targets.
2. Replace placeholder bundle identifiers if the App Store Connect record uses different identifiers.
3. Confirm the host permission is limited to `https://www.policywatcher.online/*` and the only API permissions are temporary active-tab inspection and scripting.
4. Test the disclosure, selected-text scan, manual fallback, structured submission and every error state in Safari on the supported macOS target. Add iOS only after validating popup sizing and page injection on iPhone/iPad.
5. Complete App Privacy consistently with `PRIVACY.md`, archive, validate, notarize where applicable and upload through App Store Connect.

The Git release contains shared source and a reproducible Safari-source ZIP. It intentionally does not claim to contain an App Store-signed binary because signing requires the publisher’s certificate and Team.

---

Il tool Apple attuale è `safari-web-extension-packager`. Dopo la generazione, assegna in Xcode il Team dello sviluppatore ai target app ed estensione, verifica gli identificativi bundle, prova tutti gli stati in Safari e completa App Privacy in modo coerente con `PRIVACY.md`. Firma, notarizzazione e invio App Store richiedono l’account Apple Developer del publisher e non fanno parte dello ZIP sorgente.
