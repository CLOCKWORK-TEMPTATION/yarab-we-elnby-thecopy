export const EVIDENCE_SOURCE_TYPES = Object.freeze([
  'file',
  'directory',
  'command',
  'config',
  'runtime',
  'inference'
]);

export const EVIDENCE_RESULT_VALUES = Object.freeze([
  'success',
  'failure',
  'blocked',
  'skipped',
  'info'
]);

function isIsoTimestamp(value) {
  return Number.isFinite(Date.parse(value));
}

export function validateEvidenceRecord(input = {}) {
  const errors = [];

  if (!String(input.id || '').trim()) {
    errors.push('id is required');
  }

  if (!EVIDENCE_SOURCE_TYPES.includes(input.source_type)) {
    errors.push(`source_type must be one of: ${EVIDENCE_SOURCE_TYPES.join(', ')}`);
  }

  if (!String(input.location || '').trim()) {
    errors.push('location is required');
  }

  if (!EVIDENCE_RESULT_VALUES.includes(input.result)) {
    errors.push(`result must be one of: ${EVIDENCE_RESULT_VALUES.join(', ')}`);
  }

  if (!String(input.summary || '').trim()) {
    errors.push('summary is required');
  }

  if (!String(input.timestamp || '').trim() || !isIsoTimestamp(input.timestamp)) {
    errors.push('timestamp must be a valid ISO date/time string');
  }

  if (input.source_type === 'command' && !String(input.command || '').trim()) {
    errors.push('command is required when source_type is command');
  }

  return errors;
}

export function createEvidenceRecord(input = {}) {
  const record = {
    id: input.id,
    source_type: input.source_type,
    location: input.location,
    command: input.command || null,
    result: input.result || 'info',
    summary: input.summary,
    details: input.details || '',
    timestamp: input.timestamp || new Date().toISOString()
  };

  const errors = validateEvidenceRecord(record);
  if (errors.length > 0) {
    throw new Error(`Invalid evidence record: ${errors.join('; ')}`);
  }

  return Object.freeze(record);
}
