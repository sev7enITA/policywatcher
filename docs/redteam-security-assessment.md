# Red Team Security Assessment - Release 3.5.1 / v3.5 Branch

**Date:** 2026-07-08
**Subject:** Vulnerability & Threat Vector Assessment
**Target:** PolicyWatcher v3.5.1 Operational Update

---

## Executive Summary

From a Red Team perspective, the v3.5 release branch has **substantially minimized the attack surface** compared to previous architectures. Crucial operational features (such as the VPS Agent and Database backups) have been designed with strong defense-in-depth principles (non-shell spawning, AES-256-GCM encryption, HMAC signing).

Additionally, the **deletion of the debug-env endpoint** (`src/app/api/admin/debug-env/route.ts`) resolves a high-risk information disclosure flaw that exposed server environment variables.

---

## 1. Threat Matrix & Mitigation Verification

### 1.1 SSRF & DNS Rebinding (Direct Scraper)
*   **Attack Vector:** Attacker sets up a domain `attacker.com` pointing to a public IP. Scraper validates the URL. Attacker changes DNS record to `127.0.0.1`. Scraper connects, retrieving local server data.
*   **Audit Status:** **FULLY MITIGATED.**
    *   `fetchWithRetry` and `fetchWithHttp2` resolve the domain exactly once.
    *   The socket connection is opened directly to the resolved IP address (`hostname: pinnedIp`).
    *   Host headers and SNI are set to the original domain name manually.
    *   **Verdict:** Safe from DNS Rebinding and SSRF.

### 1.2 SSRF & DNS Rebinding (VPS Playwright Renderer)
*   **Attack Vector:** Playwright navigates to `attacker.com`, which changes DNS resolutions to local IP addresses during rendering or dynamic subresource calls.
*   **Audit Status:** **PARTIALLY MITIGATED (Design Limitation).**
    *   Dynamic request interceptor `validateBrowserRequestUrl` evaluates the destination of every browser subrequest.
    *   However, Chromium manages its own socket resolutions internally. If a hostname resolves to a public IP during the validation phase but resolves to a private IP on socket creation inside Chromium, the browser will execute the connection.
    *   **Verdict:** This is a documented request-boundary limitation.
    *   **Remediation Suggestion:** Ensure the VPS Chromium instance runs inside an isolated container (e.g., Docker) or network namespace (via iptables rules) where all egress to private ranges (`10.0.0.0/8`, `192.168.0.0/16`, etc.) is blocked at the system level.

### 1.3 OS Command Injection (VPS Operations Agent)
*   **Attack Vector:** Attacker sends a malicious version string (e.g., `; rm -rf /;`) or checksum to execute arbitrary commands on the VPS.
*   **Audit Status:** **FULLY MITIGATED.**
    *   Arguments are passed to `spawn()` as a structured string array.
    *   `shell: false` is explicitly set, preventing the OS shell from interpreting operators like `;`, `&&`, or backticks.
    *   Version values are validated against `^[0-9A-Za-z._-]{1,64}$`, blocking syntax manipulation.
    *   **Verdict:** Secure.

### 1.4 Zip-Slip & Directory Traversal (VPS Operations Agent)
*   **Attack Vector:** Attacker deploys a malicious package with files containing relative paths (e.g. `../../vps-agent/agent.mjs`) to overwrite server files.
*   **Audit Status:** **FULLY MITIGATED.**
    *   `isSafeArchiveEntry` normalizes and inspects every zip/tar entry.
    *   Any entry that starts with `/`, contains null bytes, or attempts to traverse out of the extraction directory (`..`) is rejected.
    *   **Verdict:** Secure.

### 1.5 Database Backup Data Exfiltration
*   **Attack Vector:** Unauthorized user triggers database export, or attempts to brute force encrypted files to read customer database records.
*   **Audit Status:** **FULLY MITIGATED.**
    *   The `/api/admin/export-encrypted` endpoint requires the `admin` session role.
    *   Encryption is handled via **AES-256-GCM** (authenticated encryption). GCM prevents bit-flipping attacks (unlike CBC or CTR modes without HMACs).
    *   Key derivation uses `scrypt` with a random 16-byte salt and 32-byte key size, defending against precomputed dictionary/rainbow-table attacks.
    *   Password length is strictly enforced to be at least 12 characters.
    *   **Verdict:** Secure.

---

## 2. Identified Vulnerabilities & Minor Findings

### Finding 1: Lack of Anti-CSRF on Admin Endpoints
*   **Severity:** 🟡 Low
*   **Threat:** Next.js API routes (like `/api/admin/vps-services` or `/api/admin/export-encrypted`) rely entirely on the HTTP-only `pw_admin_session` cookie for authentication. They do not employ CSRF tokens or verify Origin/Referer headers strictly.
*   **Impact:** A logged-in administrator visiting a malicious website could theoretically have requests triggered against their dashboard APIs (Cross-Site Request Forgery).
*   **Mitigation present:** The session cookie is configured with `sameSite: 'strict'`. This prevents the browser from sending the cookie on cross-site requests, mitigating standard CSRF vectors.
*   **Remediation Suggestion:** For high-value actions (like exporting database backups or initiating VPS updates), verify the `Origin` and `Referer` headers on incoming POST requests to ensure they originate from `policywatcher.online`.

---

## 3. Red Team Penetration Testing Checklist

For future external audits or Red Team operations, we recommend verifying the following test vectors:

1.  **Hexadecimal/Decimal IP Literals:** Check if inputs like `http://0x7f000001/` or `http://2130706433/` bypass `isIP` and are processed by the DNS resolver. Verify that `resolveAndPinHostname` successfully catches and blocks them once resolved.
2.  **VPS Agent Token Timing:** Verify that the `timingSafeEqual` comparison on HMAC headers successfully prevents side-channel timing analysis.
3.  **Local VPS Port Exposure:** Ensure the `policywatcher-vps-agent` (default port `8791`) and `policywatcher-renderer` (default port `8787`) are bound **only** to `127.0.0.1` (or local interfaces behind Nginx), and are not accessible on external public-facing ports.
