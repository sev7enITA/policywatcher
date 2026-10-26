import type { ScrapeResult } from '../scraper';

/** Observed checks, never a calibrated probability or a publication decision. */
export interface AcquisitionOutcome {
  schemaVersion: 1;
  transport: 'received' | 'failed' | 'unknown';
  extraction: 'accepted' | 'partial' | 'rejected' | 'not_evaluated';
  scope: 'accepted_by_source_guards' | 'rejected' | 'not_evaluated';
  quality: 'passed_scraper_checks' | 'failed_scraper_checks' | 'not_evaluated';
  currency: 'live' | 'historical' | 'unknown';
  changeConfirmation: 'not_evaluated';
  eligibleForComparison: boolean;
}

export function acquisitionOutcome(result: ScrapeResult): AcquisitionOutcome {
  const attempts = result.diagnostics || [];
  const historical = ['wayback', 'commoncrawl'].includes(result.source)
    || Boolean(result.historicalReference);
  const liveAccepted = result.status === 'ok' && ['direct', 'http2', 'rendered'].includes(result.source);
  const scopeRejected = /host_drift|path_drift|source_migration|required_scope|source_mismatch/.test(result.reason);
  const contentRejected = attempts.some((attempt) => attempt.status === 'rejected');
  const received = attempts.some((attempt) => ['ok', 'partial', 'rejected'].includes(attempt.status)
    || Boolean(attempt.httpStatus && attempt.httpStatus > 0));
  return {
    schemaVersion: 1,
    transport: received ? 'received' : attempts.some((a) => a.status === 'failed') ? 'failed' : 'unknown',
    extraction: liveAccepted ? result.partial ? 'partial' : 'accepted'
      : contentRejected ? 'rejected' : 'not_evaluated',
    scope: scopeRejected ? 'rejected' : liveAccepted ? 'accepted_by_source_guards' : 'not_evaluated',
    quality: liveAccepted ? result.partial ? 'failed_scraper_checks' : 'passed_scraper_checks'
      : contentRejected ? 'failed_scraper_checks' : 'not_evaluated',
    currency: historical ? 'historical' : liveAccepted ? 'live' : 'unknown',
    changeConfirmation: 'not_evaluated',
    eligibleForComparison: liveAccepted && !result.partial && !scopeRejected,
  };
}
