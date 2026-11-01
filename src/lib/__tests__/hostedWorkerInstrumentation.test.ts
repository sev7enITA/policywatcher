import { afterEach, expect, it, vi } from 'vitest';
const start = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../engine/hostedWorker', () => ({ startHostedPreviewWorker: start }));
import { register } from '../../instrumentation';

afterEach(() => { vi.unstubAllEnvs(); start.mockClear(); });

it('registers only a Node hosted runtime and never starts from build, Edge or stable', async () => {
  vi.stubEnv('NEXT_RUNTIME', 'nodejs'); vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
  vi.stubEnv('NEXT_PHASE', 'phase-production-build');
  await register();
  vi.stubEnv('NEXT_PHASE', 'phase-production-server'); vi.stubEnv('POLICYWATCHER_ENGINE_BUILD_PHASE', '1');
  await register();
  vi.stubEnv('POLICYWATCHER_ENGINE_BUILD_PHASE', '0'); vi.stubEnv('NEXT_RUNTIME', 'edge');
  await register();
  vi.stubEnv('NEXT_RUNTIME', 'nodejs'); vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '0');
  await register();
  expect(start).not.toHaveBeenCalled();
  vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
  await register();
  expect(start).toHaveBeenCalledTimes(1);
});
