import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: [
        'src/lib/adminAuth.ts',
        'src/lib/auth.ts',
        'src/lib/policyConfidence.ts',
        'src/lib/rateLimit.ts',
        'src/lib/subscriberPreferences.ts',
        'src/lib/diffParse.ts',
        'src/lib/exporters.ts',
        'src/lib/scraper.ts',
      ],
    },
  },
});
