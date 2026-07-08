# Technical & Functional Audit Report (v3.5.1)

**Date**: 2026-07-06
**Scope**: Code audit of the latest 3.5.1 updates (Leaderboard, Admin Access Logs, VPS Companion Services, Wayback fallbacks, and Dynamic Database Configs)
**Status**: All unit tests passing (73/73), production compilation check successful.

---

## 1. Functional Assessment

### 1.1 Policy Signals Board (`/leaderboard`) (Grade: Excellent)
*   **Formula Validity:** The `evidenceIndex` calculation correctly balances coverage (38pts), source checks (26pts), baseline verification (22pts), and freshness (14pts) while penalizing suspended/unverified sources (-12pts).
*   **Tier Enforcement:** Dynamically groups companies into `Evidence-ready`, `Watchlist`, `Suspended`, and `Inventory only` without relying on arbitrary hardcoded ratings.
*   **Recommendation:** To prevent client-side time zone mismatch warnings, ensure that `formatDate` and `formatCompactDate` utilize a fixed, consistent UTC locale timezone at the root options level:
    ```typescript
    timeZone: 'UTC'
    ```

### 1.2 Admin Access Logs & Access Log API
*   **Event Coverage:** Tracks login success, failures, logouts, session invalidations, and configuration errors.
*   **Performance Guard:** Database writes are raced with a 1-second timeout (`Promise.race` with `1_000ms`) to protect API response times if the database suffers lock contention. This is an exceptional design choice.
*   **Read-Only Separation:** Access log retrieval blocks the read-only `auditor` role (returns `403 Forbidden`) and requires full `admin` authentication.

### 1.3 VPS Companion Services Dashboard (`/admin/vps-services`)
*   **Status Isolation:** Correctly keeps bearer tokens and server endpoints server-side. Exposes only masked URLs and non-sensitive diagnostic latency.
*   **Authorized Control:** Triggering active browser smoke tests (`POST /api/admin/vps-services`) is restricted to the full `admin` role, preventing unauthorized load triggering on your Playwright renderer VPS.

---

## 2. Technical & Cybersecurity Audit

### 2.1 Public Data Gateway (`src/lib/publicDataGate.ts`) (Grade: A+)
*   **Isolation Control:** Evaluates environment flags to block seeded/mock records on production environments. This guarantees that PolicyWatcher displays only verified scraped data on public domains.
*   **Query Filtering:** Integrates cleanly with `/api/companies` and other client endpoints, ensuring no mock data leaks.

### 2.2 Re-Baselining Transaction Logic (`src/lib/policyBaseline.ts`)
*   **Rollback Safety:** Employs atomic database transactions (`tx: Prisma.TransactionClient`) to replace seeded records with verified live text.
*   **Sanity Checks:** Protects history by aborting if there are pre-existing verified logs or admin-reviewed changes.

---

## 3. Recommended Technical Improvements (Corrections)

### 3.1 GDPR Compliance: Anonymize Logged IP Addresses
The `AdminAccessLog` stores the user's plain text IP address. Under GDPR, IP addresses are considered Personal Data.
*   *Suggestion:* Mask the last octet of IPv4 addresses (or parts of IPv6) before writing to the database to preserve anonymity while maintaining geolocation/diagnostic utility:
    ```typescript
    function maskIpAddress(ip: string | null): string | null {
      if (!ip) return null;
      if (ip.includes('.')) {
        return ip.replace(/\.\d+$/, '.xxx'); // e.g., 192.168.1.123 -> 192.168.1.xxx
      }
      if (ip.includes(':')) {
        return ip.replace(/:[0-9a-fA-F]+$/, ':xxxx'); // IPv6 masking
      }
      return ip;
    }
    ```

### 3.2 Turbopack Warning in `databaseConfig.ts`
The dynamic use of `process.cwd()` and `fs` imports inside Next.js components triggers Turbopack warnings because it marks files for full recursive directory tracing at compile-time.
*   *Correction:* Force the file to run only on the server by appending a `'server-only'` directive at the top, or dynamically importing `fs` inside the diagnostic function only:
    ```typescript
    import 'server-only';
    ```

### 3.3 Database Table Cleanup Policy
Because every login/failure/action creates a row in `AdminAccessLog`, the SQLite database size will grow infinitely over time.
*   *Correction:* Implement a simple retention cleanup trigger (e.g. inside the weekly/monthly cron) to delete log rows older than 90 days:
    ```typescript
    await db.adminAccessLog.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }
    });
    ```
