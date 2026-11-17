/** The HTTP process owns the private preview worker, not an individual request. */
export async function register() {
  // Keep the literal runtime boundary so Next.js can omit Node-only imports from Edge.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_PHASE === 'phase-production-build'
        || process.env.POLICYWATCHER_ENGINE_BUILD_PHASE === '1'
        || process.env.POLICYWATCHER_HOSTED_PREVIEW !== '1') return;

    // Do not import Prisma or engine modules in Edge, build or stable runtimes.
    const { startHostedPreviewWorker } = await import('./lib/engine/hostedWorker');
    await startHostedPreviewWorker();
  }
}
