'use strict';

const API_URL = 'https://policywatcher.online/api/policy-inquiries';
const ALLOWED_KEYS = new Set([
  'companyName', 'senderDomain', 'sourceUrl', 'noticeDate', 'effectiveDate',
  'policyTypes', 'lang', 'honeypot'
]);
const ALLOWED_TYPES = new Set(['privacy', 'terms', 'cookies', 'ai', 'acceptable-use']);

function safeString(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sanitizePayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_PAYLOAD');
  if (Object.keys(input).some((key) => !ALLOWED_KEYS.has(key))) throw new Error('INVALID_PAYLOAD');
  return {
    companyName: safeString(input.companyName, 160),
    senderDomain: safeString(input.senderDomain, 253),
    sourceUrl: safeString(input.sourceUrl, 2000),
    noticeDate: safeString(input.noticeDate, 40),
    effectiveDate: safeString(input.effectiveDate, 40),
    policyTypes: Array.isArray(input.policyTypes)
      ? [...new Set(input.policyTypes.filter((type) => typeof type === 'string' && ALLOWED_TYPES.has(type)))]
      : [],
    lang: input.lang === 'en' ? 'en' : 'it',
    honeypot: ''
  };
}

async function postInquiry(input) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const payload = sanitizePayload(input);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal
    });
    let responsePayload = null;
    try { responsePayload = await response.json(); } catch { responsePayload = null; }
    return { ok: response.ok, status: response.status, payload: responsePayload };
  } catch {
    return { ok: false, status: 0, payload: null, networkError: true };
  } finally { clearTimeout(timeout); }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== 'POLICYWATCHER_QUERY') return false;
  postInquiry(message.payload).then(sendResponse);
  return true;
});
