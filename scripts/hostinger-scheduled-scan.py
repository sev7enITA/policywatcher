#!/usr/bin/env python3
"""Server-local scan launcher. No digest, no secret arguments, no HTTP retry.

Run --check before installing in hPanel. Notification mode must be explicit;
silent suppresses scan-triggered subscriber and administrator email.
The production database, credentials and receipts stay on the hosting account.
"""
import argparse
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import shlex
import sqlite3
import time
import urllib.error
import urllib.request

ORIGIN = "https://policywatcher.online"
MIN_INTERVAL_MS = 20 * 60 * 60 * 1000
MAX_WAIT_SECONDS = 20 * 60


class ScanError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ScanError("Authenticated endpoint redirected; request stopped")


def read_environment(path):
    values = {}
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        tokens = shlex.split(value, comments=True)
        values[key.strip()] = tokens[0] if tokens else ""
    return values


def validate_environment(values, database):
    if values.get("POLICYWATCHER_DEPLOYMENT_TARGET") != "production":
        raise ScanError("Production deployment target is required")
    configured = values.get("DATABASE_URL", "")
    if not configured.startswith("file:") or Path(configured[5:]).resolve() != database.resolve():
        raise ScanError("Database path does not match the production database")
    secret = values.get("API_SECRET", "")
    if not secret or "\n" in secret or "\r" in secret:
        raise ScanError("A valid server-side API_SECRET is required")


def connect(database):
    db = sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True, timeout=15)
    db.row_factory = sqlite3.Row
    return db


def read_runs(db):
    return [dict(row) for row in db.execute("SELECT * FROM ScanRun ORDER BY startedAt DESC LIMIT 100")]


def should_skip(runs, policy_count, now_ms):
    for row in runs:
        if row["status"] == "running":
            expiry = row.get("leaseExpiresAt") or (row["startedAt"] + 24 * 60 * 60 * 1000)
            if expiry > now_ms:
                return "scan_already_running"
        if row["status"] != "completed" or row.get("selectedRecords") != policy_count:
            continue
        try:
            options = json.loads(row.get("optionsJson") or "{}")
        except (ValueError, TypeError):
            continue
        if not isinstance(options, dict) or options.get("companySlug"):
            continue
        if now_ms - row["startedAt"] < MIN_INTERVAL_MS:
            return "recent_full_scan"
    return None


def safe_result(row):
    fields = ("id", "status", "startedAt", "completedAt", "selectedRecords", "uniqueSources",
              "uniqueAvailableSources", "uniqueUnavailableSources", "errorRecords")
    return {key: row.get(key) for key in fields}


def validate_capabilities(secret, opener):
    req = urllib.request.Request(ORIGIN + "/api/cron/check-all", headers={
        "Authorization": "Bearer " + secret, "Accept": "application/json",
    })
    try:
        with opener.open(req, timeout=20) as response:
            payload = json.loads(response.read())
        if payload.get("contract") != "scan-notifications-v1" or set(payload.get("notificationModes", [])) != {"silent", "subscribers"}:
            raise ScanError("Scan notification contract is not supported; no scan was requested")
    except (urllib.error.URLError, TimeoutError, ValueError, AttributeError) as error:
        raise ScanError("Scan notification contract could not be verified; no scan was requested") from error


def request_scan(secret, opener, notification_mode):
    req = urllib.request.Request(ORIGIN + "/api/cron/check-all", data=json.dumps({"notificationMode": notification_mode}).encode(), headers={
        "Authorization": "Bearer " + secret, "Content-Type": "application/json",
        "User-Agent": "PolicyWatcher-Server-Scheduler/2.0",
    })
    try:
        with opener.open(req, timeout=90) as response:
            try:
                payload = json.loads(response.read())
            except ValueError:
                return response.status, None
            if not isinstance(payload, dict):
                return response.status, None
            return response.status, payload.get("scanRunId")
    except urllib.error.HTTPError as error:
        # A proxy timeout may leave the durable scan running. Do not resubmit.
        return error.code, None
    except (urllib.error.URLError, TimeoutError):
        return None, None


def wait_for_scan(db, before_ids, request_ms, scan_id, http_status):
    deadline = time.monotonic() + MAX_WAIT_SECONDS
    while time.monotonic() < deadline:
        rows = read_runs(db)
        candidates = [row for row in rows if (
            row["id"] == scan_id if scan_id else
            row["id"] not in before_ids and row["startedAt"] >= request_ms - 2000
        )]
        if candidates:
            row = candidates[-1]
            if row["status"] == "completed":
                return {"status": "completed", "httpStatus": http_status, "scan": safe_result(row)}
            if row["status"] == "failed":
                raise ScanError("Persisted scan failed; inspect ScanRun on the server")
        elif time.monotonic() > deadline - MAX_WAIT_SECONDS + 30:
            raise ScanError("No persisted scan appeared; request was not retried")
        time.sleep(10)
    raise ScanError("Scan completion not observed within 20 minutes; request was not retried")


def execute(home, check_only, notification_mode):
    root = home / "domains/policywatcher.online"
    database = root / "policywatcher-data/production.db"
    values = read_environment(root / "hbuilds/config/.env")
    validate_environment(values, database)
    if notification_mode not in ("silent", "subscribers"):
        raise ScanError("An explicit notification mode is required")
    opener = urllib.request.build_opener(NoRedirect())
    validate_capabilities(values["API_SECRET"], opener)
    state_dir = home / "policywatcher-ops"
    state_dir.mkdir(mode=0o700, exist_ok=True)
    state_dir.chmod(0o700)
    with (state_dir / "scheduled-scan.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return {"status": "skipped", "reason": "launcher_already_running"}
        with connect(database) as db:
            runs = read_runs(db)
            count = db.execute("SELECT COUNT(*) FROM Policy").fetchone()[0]
            if not count:
                raise ScanError("No policies in production database")
            skip = should_skip(runs, count, int(time.time() * 1000))
            if check_only:
                return {"status": "ready", "policyCount": count, "nextRunWouldSkip": skip,
                        "origin": ORIGIN, "mailConfigured": bool(values.get("SMTP_HOST")), "notificationMode": notification_mode, "digestInvoked": False}
            if skip:
                return {"status": "skipped", "reason": skip, "policyCount": count}
            request_ms = int(time.time() * 1000)
            http_status, scan_id = request_scan(values["API_SECRET"], opener, notification_mode)
            if http_status == 409:
                return {"status": "skipped", "reason": "concurrent_scan", "httpStatus": 409}
            if http_status in (400, 401, 403, 404, 405, 429):
                raise ScanError("Scan endpoint rejected request (HTTP %s)" % http_status)
            return wait_for_scan(db, {row["id"] for row in runs}, request_ms, scan_id, http_status)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate configuration and read-only API capability without starting a scan")
    parser.add_argument("--notifications", required=True, choices=("silent", "subscribers"))
    args = parser.parse_args()
    os.umask(0o077)
    try:
        result = execute(Path.home(), args.check, args.notifications)
        exit_code = 0
    except (ScanError, OSError, ValueError, sqlite3.Error) as error:
        result = {"status": "failed", "reason": str(error) if isinstance(error, ScanError) else type(error).__name__}
        exit_code = 1
    result["notificationMode"] = args.notifications
    result["checkedAt"] = datetime.now(timezone.utc).isoformat()
    if not args.check:
        state = Path.home() / "policywatcher-ops"
        if state.is_dir():
            temporary = state / "scheduled-scan-last.json.tmp"
            temporary.write_text(json.dumps(result, indent=2) + "\n")
            temporary.replace(state / "scheduled-scan-last.json")
    print(json.dumps(result))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
