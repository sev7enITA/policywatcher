# Admin login hydration boundary, 22 November 2026

A bounded local reproduction confirms that the old login HTML accepts typed values before React attaches its controlled-input handlers. After hydration, clicking Sign In reads empty React state, clears both displayed fields during the error render and never calls the authentication endpoint. This matches the primary audit's reported symptom; it does not establish that every failed login has this cause.

## Minimal correction

The initial server snapshot now disables both inputs and the button until the client hydration snapshot is ready. `useSyncExternalStore` supplies a stable false server snapshot and true client snapshot, so server and initial hydration output agree. It avoids an effect-driven state update. A visible status describes preparation, inputs reference that status, the card exposes busy state and a no-JavaScript message provides recovery guidance. The submit handler also guards readiness and loading. Authentication credentials, API contract, redirects, cookies, server authorization and scan configuration are unchanged.

## Executed evidence

- Two SSR regressions fail against parent `4fd791e19b1b1ca68f6ec57d7d84ee1c829f17b4` and pass on the fix, with networking denied by the OS.
- Thirty-one tests across login SSR, admin authentication, session auth and administrative mutation boundaries pass with OS networking denied. Focused ESLint and source TypeScript checks pass.
- The actual React page was bundled into an isolated localhost fixture, with Next router/image/CSS and the auth response stubbed. A fresh Chrome Beta headless context used no real profile or credentials and made zero external requests. Delayed hydration on the parent reproduces enabled inputs, fields cleared, missing-credentials error and zero auth calls. With the fix, three initial controls are disabled; after hydration both click and Enter retain the inputs and send exactly one correctly shaped mocked auth request.
- The fixture's first compilation failed to resolve React inside the mock namespace. That local setup failure remains preserved; adding the fixture root as its resolution directory allowed the final runs. This is not a product failure.

[Machine-readable receipt](admin-login-hydration-2026-11-22/receipt.json), [parent negative control](admin-login-hydration-2026-11-22/parent-negative.log), [fixed SSR checks](admin-login-hydration-2026-11-22/fixed-offline.log), [focused authentication regressions](admin-login-hydration-2026-11-22/auth-regressions.log).

## Offline reproduction

Use installed dependencies; no package install, model, database or remote service is required:

```sh
sandbox-exec -p '(version 1) (allow default) (deny network*)' node node_modules/vitest/vitest.mjs run src/lib/__tests__/adminLoginHydration.test.tsx src/lib/__tests__/adminAuth.test.ts src/lib/__tests__/adminMutationBoundary.test.ts src/lib/__tests__/auth.test.ts --reporter=dot
```

For the negative control, keep the new test and temporarily replace only the page with the recorded parent, restoring the fixed file in a finally block:

```python
from pathlib import Path
import subprocess
page = Path('src/app/admin/login/page.tsx')
fixed = page.read_bytes()
command = ['sandbox-exec', '-p', '(version 1) (allow default) (deny network*)',
           'node', 'node_modules/vitest/vitest.mjs', 'run',
           'src/lib/__tests__/adminLoginHydration.test.tsx']
try:
    page.write_bytes(subprocess.check_output(['git', 'show',
        '4fd791e19b1b1ca68f6ec57d7d84ee1c829f17b4:src/app/admin/login/page.tsx']))
    assert subprocess.run(command).returncode != 0
finally:
    page.write_bytes(fixed)
assert subprocess.run(command).returncode == 0
```

The browser fixture is retained locally at `output/admin-login-hydration/browser-fixture-retained.mjs`; its exact hash is in the receipt. Its scope is actual React SSR/hydration with explicit framework/network stubs, not a full hosted Next application, visual/a11y certification, real credential validation or production deployment. The separate private r3 post-login cookie/redirect issue remains undiagnosed and is not attributed to this change. No private r3 file, environment, database or deployment was modified.
