# Security and Functional Audit — Release 3.6.3

**Date:** 2026-07-10
**Subject:** v3.6.3 Audit and Red Team Evaluation
**Target:** PolicyWatcher v3.6.3 Release

---

## 1. Functional Audit of New Features

### 1.1 Curated Public Observatory (`/observatory`)
*   **Purpose:** Houses a public-facing registry of authoritative resources (OECD.AI, EDPB, NIST AIRC, FTC, UK ICO, IEEE ISoPE) to provide governance context.
*   **Evaluation:**
    *   **Registry first, feed second:** The registry is static and local, preventing untrusted automatic external inputs from polluting the dashboard.
    *   **Reminder and Planning Events:** Offers planning and review window notifications for researchers, complete with `.ics` calendar file export.
    *   **Verdict:** Outstanding compliance and research utility.

### 1.2 Revolut Source Remediation (`docs/source-remediation-revolut-2026-07-10.md`)
*   **Purpose:** Documents the remediation of 4 blocked Revolut URLs.
*   **Evaluation:**
    *   **Market Separation:** Lithuanian-specific URLs (`https://www.revolut.com/en-LT/legal/...`) are introduced to handle Lithuania's local compliance restrictions.
    *   **Safety Gates:** If provider challenge screens or WAF pages persist, the records are kept **suspended** instead of auto-publishing stale or unusable scraped content.
    *   **Verdict:** Excellent adherence to the "evidence first" principle.

---

## 2. Red Team Security Assessment

### 2.1 Observatory & Client-Side Calendar Export
*   **Vulnerability Target:** Check if calendar download paths or variables are vulnerable to XSS or ICS Injection (introducing commands or remote files through malicious ICS headers).
*   **Audit Status:** **SAFE.**
    *   The `buildObservatoryIcs` helper cleans newlines (`replace(/\n/g, ' ')`) in event strings and formats parameters strictly as defined.
    *   Data is loaded entirely from the static list in `src/lib/observatory.ts`. There are no user-input vectors that can modify the data structure, preventing file injection or CSRF.

### 2.2 Hostinger-Safe Remediation Scripts
*   **Vulnerability Target:** Check if running the remediation scripts in Hostinger shell environments introduces arbitrary commands or path traversal risks.
*   **Audit Status:** **SAFE.**
    *   The `hostinger-remediate-sources.mjs` script performs strict database transaction updates based on fixed enums. No raw query input is exposed to user control.

### 2.3 URL Parameter Parsing & Site Atlas Nodes
*   **Vulnerability Target:** Check if navigation controls or dynamic graph nodes (`src/lib/publicSections.ts`) can be manipulated to trigger XSS or hijack pages.
*   **Audit Status:** **SAFE.**
    *   The `/atlas` route reads details from an allowlist node map. Node queries that do not match are safely ignored and fallback to standard dashboard nodes.

---

## 3. Red Team Penetration Testing Checklist for v3.6.3

1.  **WAF Bypass Vectors:** Ensure that any future external RSS or feed-ingestion integrations validate domain resolves using the direct Hostinger HTTP socket-pinned logic (to prevent SSRF/DNS rebinding).
2.  **Symlink Backups:** Verify that the VPS operations backup extraction paths exclude symlink resolving to prevent arbitrary directory write overrides.
