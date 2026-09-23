"""Safety tests for the server-local production scan launcher."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import urllib.error

spec = importlib.util.spec_from_file_location("scheduled_scan", Path(__file__).with_name("hostinger-scheduled-scan.py"))
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)


class ScheduledScanTests(unittest.TestCase):
    def environment(self):
        return {"POLICYWATCHER_DEPLOYMENT_TARGET": "production", "DATABASE_URL": "file:/tmp/production.db", "API_SECRET": "test-only"}

    def run_record(self, **overrides):
        return dict({"id": "scan-a", "status": "completed", "startedAt": 1000,
                     "completedAt": 2000, "selectedRecords": 50, "optionsJson": "{}"}, **overrides)

    def test_staging_database_and_missing_auth_fail_closed(self):
        for change in ({"POLICYWATCHER_DEPLOYMENT_TARGET": "staging"}, {"DATABASE_URL": "file:/tmp/staging.db"}, {"API_SECRET": ""}):
            with self.subTest(change=change), self.assertRaises(scan.ScanError):
                scan.validate_environment(dict(self.environment(), **change), Path("/tmp/production.db"))

    def test_mail_configuration_stops_the_silent_launcher(self):
        for key in ("SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"):
            with self.subTest(key=key), self.assertRaises(scan.ScanError):
                scan.validate_environment(dict(self.environment(), **{key: "configured"}), Path("/tmp/production.db"))

    def test_environment_is_parsed_without_shell_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text('API_SECRET="$(touch do-not-create)"\n# ignored\nSMTP_HOST=\n')
            self.assertEqual(scan.read_environment(path), {"API_SECRET": "$(touch do-not-create)", "SMTP_HOST": ""})

    def test_recent_full_scan_suppresses_duplicate_work(self):
        self.assertEqual(scan.should_skip([self.run_record()], 50, 3000), "recent_full_scan")
        self.assertIsNone(scan.should_skip([self.run_record()], 50, scan.MIN_INTERVAL_MS + 1000))

    def test_partial_or_targeted_scan_does_not_suppress_full_refresh(self):
        self.assertIsNone(scan.should_skip([self.run_record(selectedRecords=5)], 50, 3000))
        self.assertIsNone(scan.should_skip([self.run_record(optionsJson='{"companySlug":"meta"}')], 50, 3000))

    def test_active_lease_blocks_but_expired_lease_allows_recovery(self):
        self.assertEqual(scan.should_skip([self.run_record(status="running", leaseExpiresAt=4000)], 50, 3000), "scan_already_running")
        self.assertIsNone(scan.should_skip([self.run_record(status="running", leaseExpiresAt=2000)], 50, 3000))

    def test_redirect_never_forwards_authentication(self):
        with self.assertRaises(scan.ScanError):
            scan.NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://other.example/")

    def test_proxy_error_is_one_request_and_preserves_completion_check(self):
        opener = Mock()
        opener.open.side_effect = urllib.error.HTTPError(scan.ORIGIN, 500, "timeout", {}, None)
        self.assertEqual(scan.request_scan("test-only", opener), (500, None))
        self.assertEqual(opener.open.call_count, 1)
        req = opener.open.call_args.args[0]
        self.assertEqual(req.full_url, scan.ORIGIN + "/api/cron/check-all")
        self.assertEqual(req.data, b"{}")

    def test_persisted_completion_wins_over_proxy_error(self):
        row = self.run_record(startedAt=3000)
        with patch.object(scan, "read_runs", return_value=[row]):
            result = scan.wait_for_scan(None, {"old-scan"}, 2500, None, 500)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["scan"]["id"], "scan-a")
        self.assertNotIn("optionsJson", result["scan"])

    def test_persisted_failure_is_not_reported_as_success(self):
        with patch.object(scan, "read_runs", return_value=[self.run_record(status="failed")]), self.assertRaises(scan.ScanError):
            scan.wait_for_scan(None, set(), 0, "scan-a", 200)


if __name__ == "__main__":
    unittest.main()
