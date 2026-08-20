import 'server-only';

import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import type { InternalStudyPayload } from './internalExecutiveStudyTypes';

const SAFE_CONFIGURATION_ERROR = 'Confidential study configuration is unavailable.';

function configurationError(): Error {
  return new Error(SAFE_CONFIGURATION_ERROR);
}

function privateStudyPath(): string {
  const configured = process.env.POLICYWATCHER_INTERNAL_STUDY_PATH?.trim();
  if (!configured || !isAbsolute(configured)) throw configurationError();
  return configured;
}

function assertPayload(value: unknown): asserts value is InternalStudyPayload {
  if (!value || typeof value !== 'object') throw configurationError();
  const candidate = value as Partial<InternalStudyPayload>;
  if (
    candidate.version !== 1
    || typeof candidate.researchCutoff !== 'string'
    || !candidate.datasets
    || !Array.isArray(candidate.sources)
    || !Array.isArray(candidate.chapters)
    || !candidate.copy
    || typeof candidate.copy.strings !== 'object'
    || typeof candidate.copy.scenarioInterpretation !== 'object'
    || !Array.isArray(candidate.copy.recommendationItems)
    || !Array.isArray(candidate.copy.thesisItems)
    || !Array.isArray(candidate.copy.businessColumns)
    || !Array.isArray(candidate.copy.readinessCards)
    || !Array.isArray(candidate.copy.methodologyItems)
    || !Object.values(candidate.datasets).every(Array.isArray)
  ) {
    throw configurationError();
  }
}

/**
 * Loads the confidential study only from the server filesystem after the page
 * has verified an authenticated Admin or Auditor session. GitHub deployments
 * must inject the ignored file and set POLICYWATCHER_INTERNAL_STUDY_PATH to
 * its absolute, securely mounted location. The study is never traced into the
 * release artifact automatically.
 */
export async function loadInternalExecutiveStudy(): Promise<InternalStudyPayload> {
  let raw: string;
  try {
    raw = await readFile(privateStudyPath(), 'utf8');
  } catch {
    throw configurationError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw configurationError();
  }
  assertPayload(payload);
  return payload;
}
