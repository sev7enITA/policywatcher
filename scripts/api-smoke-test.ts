import fs from 'fs';
import path from 'path';

type TestStatus = 'pass' | 'fail' | 'skip';

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  cookie?: string;
  bearer?: string;
}

const root = process.cwd();
const baseUrl = (process.env.SMOKE_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    const value = rawValue
      .trim()
      .replace(/^['"]|['"]$/g, '');

    process.env[key] = value;
  }
}

function assertCondition(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function request(pathname: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.cookie) {
    headers.Cookie = options.cookie;
  }
  if (options.bearer) {
    headers.Authorization = `Bearer ${options.bearer}`;
  }

  return fetch(`${baseUrl}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, received: ${text.slice(0, 120)}`);
  }
}

async function runTest(results: TestResult[], name: string, test: () => Promise<string>) {
  try {
    const detail = await test();
    results.push({ name, status: 'pass', detail });
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

function skip(results: TestResult[], name: string, detail: string) {
  results.push({ name, status: 'skip', detail });
}

async function main() {
  loadDotEnv();

  const results: TestResult[] = [];
  const apiSecret = process.env.API_SECRET || '';
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  let firstPolicyId = '';
  let firstCompanyId = '';
  let secondCompanyId = '';
  let adminCookie = '';

  await runTest(results, 'GET /api/companies', async () => {
    const response = await request('/api/companies');
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(Array.isArray(data), 'Expected an array of companies.');
    assertCondition(data.length > 0, 'Expected at least one company.');
    firstCompanyId = data[0]?.id || '';
    secondCompanyId = data[1]?.id || '';
    firstPolicyId = data[0]?.policies?.[0]?.id || '';
    assertCondition(Boolean(firstPolicyId), 'Expected at least one policy on the first company.');
    return `${data.length} companies; first policy ${firstPolicyId.slice(0, 8)}...`;
  });

  await runTest(results, 'GET /api/changes?pageSize=5', async () => {
    const response = await request('/api/changes?pageSize=5');
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(Array.isArray(data?.changes), 'Expected changes array.');
    assertCondition(typeof data?.total === 'number', 'Expected total number.');
    return `${data.changes.length}/${data.total} changes returned.`;
  });

  await runTest(results, 'GET /api/matrix', async () => {
    const response = await request('/api/matrix');
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(Array.isArray(data?.companies), 'Expected companies matrix array.');
    return `${data.companies.length} matrix rows.`;
  });

  await runTest(results, 'GET /api/trends', async () => {
    const response = await request('/api/trends');
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(Array.isArray(data?.points), 'Expected trend points array.');
    assertCondition(typeof data?.summary?.count === 'number', 'Expected trend summary count.');
    return `${data.points.length} trend points.`;
  });

  await runTest(results, 'GET /api/policies/[id]', async () => {
    assertCondition(Boolean(firstPolicyId), 'No policy ID available from /api/companies.');
    const response = await request(`/api/policies/${firstPolicyId}`);
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(data?.id === firstPolicyId, 'Policy response ID mismatch.');
    return `policy ${firstPolicyId.slice(0, 8)}... loaded.`;
  });

  await runTest(results, 'GET /api/compare', async () => {
    assertCondition(Boolean(firstCompanyId && secondCompanyId), 'Need at least two companies for comparison.');
    const response = await request(`/api/compare?companyA=${firstCompanyId}&companyB=${secondCompanyId}`);
    assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
    const data = await readJson(response);
    assertCondition(Boolean(data?.companyA?.id && data?.companyB?.id), 'Compare response missing profiles.');
    return `${data.companyA.name} vs ${data.companyB.name}.`;
  });

  await runTest(results, 'GET /api/report/[policyId]', async () => {
    assertCondition(Boolean(firstPolicyId), 'No policy ID available from /api/companies.');
    const response = await request(`/api/report/${firstPolicyId}?lang=en`);
    assertCondition([200, 404].includes(response.status), `Expected 200 or honest 404, got ${response.status}`);
    if (response.status === 404) {
      const data = await readJson(response);
      return `honest no-report response: ${data?.error || '404'}`;
    }
    assertCondition(
      response.headers.get('content-type')?.includes('application/pdf') || false,
      'Expected PDF content-type.'
    );
    return 'PDF report generated.';
  });

  await runTest(results, 'GET /api/health without token', async () => {
    const response = await request('/api/health');
    assertCondition(response.status === 401, `Expected 401, got ${response.status}`);
    return 'protected as expected.';
  });

  if (apiSecret) {
    await runTest(results, 'GET /api/health with token', async () => {
      const response = await request('/api/health', { bearer: apiSecret });
      assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
      const data = await readJson(response);
      assertCondition(data?.status === 'ok', 'Health response did not return ok.');
      return `database exists: ${Boolean(data?.database?.exists)}`;
    });
  } else {
    skip(results, 'GET /api/health with token', 'API_SECRET not configured locally.');
  }

  for (const protectedRoute of [
    ['POST', '/api/scrape'],
    ['POST', '/api/cron/check-all'],
    ['GET', '/api/cron/weekly'],
    ['GET', '/api/cron/monthly'],
  ] as const) {
    await runTest(results, `${protectedRoute[0]} ${protectedRoute[1]} without token`, async () => {
      const response = await request(protectedRoute[1], { method: protectedRoute[0], body: protectedRoute[0] === 'POST' ? {} : undefined });
      assertCondition(response.status === 401, `Expected 401, got ${response.status}`);
      return 'protected as expected.';
    });
  }

  await runTest(results, 'POST /api/seed disabled', async () => {
    const response = await request('/api/seed', { method: 'POST', bearer: apiSecret || 'missing' });
    assertCondition(response.status === 403, `Expected 403, got ${response.status}`);
    return 'seed endpoint disabled.';
  });

  await runTest(results, 'POST /api/chat validation', async () => {
    const response = await request('/api/chat', { method: 'POST', body: {} });
    assertCondition(response.status === 400, `Expected 400, got ${response.status}`);
    return 'missing question rejected.';
  });

  await runTest(results, 'POST /api/tts validation', async () => {
    const response = await request('/api/tts', { method: 'POST', body: {} });
    assertCondition(response.status === 400, `Expected 400, got ${response.status}`);
    return 'missing text rejected.';
  });

  await runTest(results, 'POST /api/subscribers validation', async () => {
    const response = await request('/api/subscribers', {
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    assertCondition(response.status === 400, `Expected 400, got ${response.status}`);
    return 'invalid email rejected.';
  });

  if (adminPassword) {
    await runTest(results, 'POST /api/admin/auth', async () => {
      const response = await request('/api/admin/auth', {
        method: 'POST',
        body: { username: adminUser, password: adminPassword },
      });
      assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
      const setCookie = response.headers.get('set-cookie') || '';
      const cookie = setCookie.split(';')[0];
      assertCondition(cookie.startsWith('pw_admin_session='), 'Session cookie was not set.');
      adminCookie = cookie;
      return 'admin session established.';
    });

    for (const adminRoute of [
      '/api/admin/metrics',
      '/api/admin/companies',
      '/api/admin/dataset-quality',
      '/api/admin/kpi-audit',
      '/api/admin/cron-status',
    ]) {
      await runTest(results, `GET ${adminRoute}`, async () => {
        assertCondition(Boolean(adminCookie), 'No admin cookie available.');
        const response = await request(adminRoute, { cookie: adminCookie });
        assertCondition(response.status === 200, `Expected 200, got ${response.status}`);
        await readJson(response);
        return 'admin API reachable.';
      });
    }

    await runTest(results, 'POST /api/admin/export-encrypted validation', async () => {
      const response = await request('/api/admin/export-encrypted', {
        method: 'POST',
        cookie: adminCookie,
        body: { password: 'short' },
      });
      assertCondition(response.status === 400, `Expected 400, got ${response.status}`);
      return 'weak backup password rejected.';
    });
  } else {
    skip(results, 'POST /api/admin/auth', 'ADMIN_PASSWORD not configured locally.');
    for (const adminRoute of [
      '/api/admin/metrics',
      '/api/admin/companies',
      '/api/admin/dataset-quality',
      '/api/admin/kpi-audit',
      '/api/admin/cron-status',
    ]) {
      skip(results, `GET ${adminRoute}`, 'No admin session available.');
    }
  }

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  for (const result of results) {
    const marker = result.status === 'pass' ? 'PASS' : result.status === 'skip' ? 'SKIP' : 'FAIL';
    console.log(`${marker.padEnd(4)} ${result.name} - ${result.detail}`);
  }

  console.log(`\nAPI smoke summary: ${passed} passed, ${failed} failed, ${skipped} skipped against ${baseUrl}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
