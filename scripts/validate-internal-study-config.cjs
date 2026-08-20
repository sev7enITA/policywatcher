'use strict';

// CommonJS is intentional: server.js must execute this before Next.js starts.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

const SAFE_CONFIGURATION_ERROR = 'Confidential study configuration is unavailable.';

function configurationError() {
  return new Error(SAFE_CONFIGURATION_ERROR);
}

function isValidPayload(value) {
  const copy = value?.copy;
  return Boolean(
    value
    && typeof value === 'object'
    && value.version === 1
    && typeof value.researchCutoff === 'string'
    && value.datasets
    && typeof value.datasets === 'object'
    && Object.values(value.datasets).every(Array.isArray)
    && Array.isArray(value.sources)
    && Array.isArray(value.chapters)
    && copy
    && typeof copy === 'object'
    && copy.strings
    && typeof copy.strings === 'object'
    && copy.scenarioInterpretation
    && typeof copy.scenarioInterpretation === 'object'
    && Array.isArray(copy.recommendationItems)
    && Array.isArray(copy.thesisItems)
    && Array.isArray(copy.businessColumns)
    && Array.isArray(copy.readinessCards)
    && Array.isArray(copy.methodologyItems)
  );
}

function validateInternalStudyConfiguration(environment = process.env) {
  const configured = environment.POLICYWATCHER_INTERNAL_STUDY_PATH?.trim();
  if (!configured || !path.isAbsolute(configured)) throw configurationError();

  let raw;
  try {
    raw = fs.readFileSync(configured, 'utf8');
  } catch {
    throw configurationError();
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw configurationError();
  }

  if (!isValidPayload(payload)) throw configurationError();
}

module.exports = {
  SAFE_CONFIGURATION_ERROR,
  validateInternalStudyConfiguration,
};
