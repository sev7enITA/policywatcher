#!/bin/bash
# PolicyWatcher - Weekly Cron Trigger Script
# This script triggers the database policy update scan and weekly digest emails.
# Configure this in your Hostinger Panel or as a system Cron job.

# Read environment variables or arguments. Never ship a fallback API secret.
APP_URL="${1:-${APP_URL:-https://www.policywatcher.online}}"
API_SECRET="${2:-${API_SECRET:-}}"

if [ -z "$API_SECRET" ]; then
  echo "Error: API_SECRET must be provided as the second argument or API_SECRET environment variable."
  exit 1
fi

echo "============================================="
echo "PolicyWatcher Cron Trigger starting..."
echo "Target URL: ${APP_URL}"
echo "Date: $(date)"
echo "============================================="

# 1. Trigger database sync, scraping, and instant alerts
echo "[Step 1/2] Triggering policy checking & database updates..."
RESPONSE_CHECK=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${APP_URL}/api/cron/check-all" \
  -H "Authorization: Bearer ${API_SECRET}")

STATUS_CHECK=$(echo "$RESPONSE_CHECK" | tr -d '\r' | tail -n 1 | cut -d: -f2)
BODY_CHECK=$(echo "$RESPONSE_CHECK" | head -n -1)

echo "Response Body: ${BODY_CHECK}"
echo "HTTP Status: ${STATUS_CHECK}"

if [ "$STATUS_CHECK" -ne 200 ]; then
  echo "⚠️ Error: Database check failed with status ${STATUS_CHECK}!"
  exit 1
fi

# 2. Trigger weekly digest emails (frequency: WEEKLY)
echo -e "\n[Step 2/2] Triggering weekly digest distribution..."
RESPONSE_DIGEST=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${APP_URL}/api/cron/weekly" \
  -H "Authorization: Bearer ${API_SECRET}")

STATUS_DIGEST=$(echo "$RESPONSE_DIGEST" | tr -d '\r' | tail -n 1 | cut -d: -f2)
BODY_DIGEST=$(echo "$RESPONSE_DIGEST" | head -n -1)

echo "Response Body: ${BODY_DIGEST}"
echo "HTTP Status: ${STATUS_DIGEST}"

if [ "$STATUS_DIGEST" -ne 200 ]; then
  echo "⚠️ Error: Weekly digest trigger failed with status ${STATUS_DIGEST}!"
  exit 1
fi

echo -e "\n✅ Cron trigger executed successfully!"
exit 0
