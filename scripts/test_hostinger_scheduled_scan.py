import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location("scheduler", Path(__file__).with_name("hostinger-scheduled-scan.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class Response(io.BytesIO):
    status = 200

class SchedulerTests(unittest.TestCase):
    def test_smtp_is_compatible_with_explicit_api_contract(self):
        db = Path("/tmp/production.db")
        m.validate_environment({"POLICYWATCHER_DEPLOYMENT_TARGET":"production", "DATABASE_URL":"file:/tmp/production.db", "API_SECRET":"test", "SMTP_HOST":"smtp.example.test"}, db)
    def test_wrong_database_is_rejected(self):
        with self.assertRaises(m.ScanError): m.validate_environment({"POLICYWATCHER_DEPLOYMENT_TARGET":"production", "DATABASE_URL":"file:/tmp/wrong.db", "API_SECRET":"test"}, Path("/tmp/production.db"))
    def test_old_server_cannot_ignore_silent_mode(self):
        opener = Mock(); opener.open.return_value = Response(b'{"ok":true}')
        with self.assertRaises(m.ScanError): m.validate_capabilities("test", opener)
        self.assertEqual(opener.open.call_count, 1)
    def test_supported_contract(self):
        opener = Mock(); opener.open.return_value = Response(json.dumps({"contract":"scan-notifications-v1", "notificationModes":["silent","subscribers"]}).encode())
        m.validate_capabilities("test", opener)
        self.assertEqual(opener.open.call_args.args[0].get_method(), "GET")
    def test_silent_request_and_no_retry_on_timeout(self):
        opener = Mock(); opener.open.side_effect = TimeoutError()
        self.assertEqual(m.request_scan("test", opener, "silent"), (None, None))
        req = opener.open.call_args.args[0]
        self.assertEqual(json.loads(req.data), {"notificationMode":"silent"})
        self.assertEqual(opener.open.call_count, 1)
    def test_partial_scan_does_not_suppress_full_inventory(self):
        rows = [{"status":"completed", "selectedRecords":50, "startedAt":900, "optionsJson":"{}"}]
        self.assertIsNone(m.should_skip(rows, 113, 1000))
    def test_recent_full_scan_prevents_duplicate(self):
        rows = [{"status":"completed", "selectedRecords":113, "startedAt":900, "optionsJson":"{}"}]
        self.assertEqual(m.should_skip(rows, 113, 1000), "recent_full_scan")
    def test_authenticated_redirect_is_rejected(self):
        with self.assertRaises(m.ScanError): m.NoRedirect().redirect_request(None,None,302,"",{},"https://other.example")

if __name__ == "__main__": unittest.main()
