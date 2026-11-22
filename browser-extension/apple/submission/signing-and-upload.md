# Signing, archive and upload  -  NOT EXECUTED

No purchase, team selection, App ID registration, signing-key creation, provisioning request, Apple upload or membership change is part of this audit. Local development identities were visible; this alone does not establish active distribution membership, bundle ownership or an App Store Connect record.

## Publisher gates

- Confirm the legal publisher, App Store Connect role, active existing developer membership, agreements/tax status and contact details through the publisher's own authenticated account.
- Confirm or reserve `online.policywatcher.safari` and `online.policywatcher.safari.Extension` under the same intended team. The generator's identifiers are candidates, not proof of registration.
- Choose the correct team for both targets and obtain the appropriate existing distribution signing/provisioning. Never use another project's profile or include private keys in an artifact.
- Confirm the intended regions, price, copyright owner, EU trader/non-trader status and any applicable publisher declarations. These are account/legal inputs, not inferred from the build.
- Complete the real Safari and physical-device QA matrix, App Privacy, age/content questionnaire, support/privacy URLs and review notes. Do not upload an unfinished beta directly to the production App Store; use TestFlight first.
- Review export compliance for the actual binary. The reviewed client uses normal platform HTTPS rather than proprietary cryptography; the publisher must confirm the applicable answers and exemption. No export-compliance declaration is filed by these scripts.

## Prepared unsigned build

```sh
python3 scripts/package-safari-ios.py --output /absolute/new/unsigned-output --build all
```

This creates an unsigned device archive and a simulator app. They are developer artifacts; **the unsigned archive cannot be used as a signed production upload**.

## Publisher-controlled signed archive

After the gates above pass, open the generated Xcode project, select the intended team and check both target identities and version/build. For a command-line archive, pass the validated team through an owner-controlled environment variable; do not store it in public source:

```sh
xcodebuild -project '/path/to/PolicyWatcher.xcodeproj' -scheme PolicyWatcher \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath '/new/path/PolicyWatcher-signed.xcarchive' \
  DEVELOPMENT_TEAM="$PUBLISHER_TEAM_ID" CODE_SIGN_STYLE=Automatic archive
```

This illustrative command is not run here. Do not add `-allowProvisioningUpdates` unless the publisher intentionally authorizes persistent account/profile changes. Validate/export through Xcode Organizer with the publisher's account. Upload via the already configured approved Xcode/Transporter route; keep authentication credentials out of the repository and chat.

Before any upload, inspect the signed app and extension: matching versions/builds, intended identifiers/team, valid signatures, expected entitlements, eleven unchanged runtime files, no debug entitlement, no private keys and correct privacy declarations. Increment the build for a new Apple upload when necessary; preserve every prior archive and receipt.

Record the actual Apple build ID and states independently: uploaded, processed, internal TestFlight enabled, external beta review approved, App Store submitted and App Store approved are different events. Add the install link only after its real availability is verified.

## Italiano

Il kit non ha selezionato team, registrato identificativi, creato chiavi/profili o effettuato upload. L'archivio corrente è senza firma. Il publisher deve verificare account e titolarità, scegliere lo stesso team per app ed estensione, completare QA/privacy e generare un archivio firmato. TestFlight, revisione beta e approvazione App Store restano stati distinti da registrare con ricevute reali.
