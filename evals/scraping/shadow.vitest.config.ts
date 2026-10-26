import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/lib/__tests__/{adaptiveAcquisition,adaptiveShadow,scraper,sourceReliability,changeConfirmation,scraperFallbackSmoke,pdfPolicy,policyExtractionScope,publicAnalysisLineage,adaptiveAcquisitionPresentation,sourceReliabilityAdminUi,adminGuides}.test.ts'] },
});
