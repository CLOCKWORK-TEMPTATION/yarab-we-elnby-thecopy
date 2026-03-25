import { getCheckDefinition } from './check-catalog.mjs';

const ALLOWED_STATUSES = new Set(['executed', 'failed', 'blocked']);

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCheckResult(record) {
  const definition = getCheckDefinition(record?.checkName);
  if (!definition) {
    throw new Error(`Unknown checkName: ${record?.checkName}`);
  }

  const status = sanitizeText(record?.status);
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error(`Unsupported status for ${record?.checkName}: ${status}`);
  }

  const scope = sanitizeText(record?.scope) || definition.scope;
  const directCause = sanitizeText(record?.directCause);
  const outputRef = sanitizeText(record?.outputRef);
  const confidenceImpact = sanitizeText(record?.confidenceImpact) || definition.defaultConfidenceImpact[status];

  if ((status === 'failed' || status === 'blocked') && !directCause) {
    throw new Error(`directCause is required when ${record?.checkName} is ${status}`);
  }

  if (!confidenceImpact) {
    throw new Error(`confidenceImpact is required for ${record?.checkName}`);
  }

  return {
    checkName: definition.checkName,
    scope,
    status,
    directCause,
    confidenceImpact,
    outputRef
  };
}

export function normalizeCheckResults(records = []) {
  return records.map((record) => normalizeCheckResult(record));
}
