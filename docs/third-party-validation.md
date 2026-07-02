# Third-Party Validation Setup

This document tracks the external checks used by PolicyWatcher as public quality
evidence. These checks are not legal, regulatory, or compliance certifications.

## 1. GitHub Quality Gate

Status: implemented.

Workflow:

- `.github/workflows/quality.yml`

Badge:

```md
[![Quality Gate](https://github.com/sev7enITA/policywatcher/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/sev7enITA/policywatcher/actions/workflows/quality.yml)
```

Recommended repository setting:

- Make `Quality Gate / Lint, build, and dataset assurance` a required status
  check before merging to `main`.

## 2. CodeQL

Status: implemented.

Workflow:

- `.github/workflows/codeql.yml`

Badge:

```md
[![CodeQL](https://github.com/sev7enITA/policywatcher/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/sev7enITA/policywatcher/actions/workflows/codeql.yml)
```

Public wording:

- Acceptable: "CodeQL analysis enabled."
- Avoid: "CodeQL certified secure."

## 3. OpenSSF Scorecard

Status: implemented; public score appears after the workflow runs on the default
branch.

Workflow:

- `.github/workflows/scorecard.yml`

Badge:

```md
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/sev7enITA/policywatcher/badge)](https://scorecard.dev/viewer/?uri=github.com/sev7enITA/policywatcher)
```

## 4. OpenSSF Best Practices

Status: passing.

Project:

- `https://www.bestpractices.dev/projects/13465`

Markdown badge:

```md
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13465/badge)](https://www.bestpractices.dev/projects/13465)
```

HTML badge:

```html
<a href="https://www.bestpractices.dev/projects/13465"><img src="https://www.bestpractices.dev/projects/13465/badge" alt="OpenSSF Best Practices"></a>
```

Evidence used by the attestation:

- `SECURITY.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- GitHub Actions quality workflow
- CodeQL workflow
- OpenSSF Scorecard workflow

Public wording:

- Acceptable: "OpenSSF Best Practices: passing."
- Acceptable: "OpenSSF Best Practices project 13465 is passing."
- Avoid: "OpenSSF certified secure."

Placement:

- README hero badge row.
- README highlighted public-evidence note.
- `/trust` obtained badge section.
- `/trust` public badge strip and evidence card.

## 5. SonarQube Cloud

Status: workflow prepared; external project and token required.

Files:

- `sonar-project.properties`
- `.github/workflows/sonar.yml`

Setup:

1. Create or import the repository in SonarQube Cloud.
2. Use organization key `sev7enita` and project key
   `sev7enITA_policywatcher`, or update `sonar-project.properties`.
3. Create a Sonar token.
4. Add GitHub secret `SONAR_TOKEN`.
5. Run the `SonarQube Cloud` workflow.
6. Copy the generated Quality Gate badge from Sonar project information.

Public wording:

- Acceptable: "SonarQube Cloud Quality Gate: passed" after the gate is actually
  passing.
- Avoid before setup: "Sonar passed."

## 6. Codecov Core Coverage

Status: workflow and Vitest core coverage prepared; Codecov token required.

Files:

- `vitest.config.ts`
- `.github/workflows/coverage.yml`
- `codecov.yml`

Setup:

1. Register or import the repository on Codecov.
2. Add GitHub secret `CODECOV_TOKEN`.
3. Run the `Core Coverage` workflow.
4. Add the Codecov badge only after the first successful upload.

Initial scope:

- `src/lib/policyConfidence.ts`
- `src/lib/subscriberPreferences.ts`
- `src/lib/diffParse.ts`

Public wording:

- Acceptable: "Core utility coverage tracked with Codecov."
- Avoid: "PolicyWatcher is fully covered."

## 7. MDN HTTP Observatory

Status: live-domain scan required after deployment.

Report URL:

```text
https://developer.mozilla.org/en-US/observatory/analyze?host=www.policywatcher.online
```

Run after each material deployment or security-header change.

Expected application controls:

- CSP is generated per request with a nonce through Next Proxy.
- Main app routes use `default-src 'none'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`.
- `script-src` uses a nonce and `strict-dynamic`, without `unsafe-inline`.
- `style-src` does not use `unsafe-inline`; legacy React style attributes are
  isolated under `style-src-attr 'unsafe-inline'` until the UI is fully migrated
  away from inline style attributes.
- Referrer-Policy is `strict-origin-when-cross-origin`.

If the live report differs from the local headers, check whether the hosting
proxy is replacing or stripping application headers.

## 8. SecurityHeaders.com

Status: live-domain scan required after deployment.

Report URL:

```text
https://securityheaders.com/?q=www.policywatcher.online&followRedirects=on&hide=on
```

Run after each material deployment or security-header change.
