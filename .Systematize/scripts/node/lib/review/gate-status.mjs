export const GATE_STATUS_VALUES = Object.freeze([
  'pending',
  'ready',
  'blocked',
  'rejected',
  'skipped',
  'degraded'
]);

const BLOCKER_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

function uniqueList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

export function validateGateStatus(input = {}) {
  const errors = [];

  if (!String(input.gate || '').trim()) {
    errors.push('gate is required');
  }

  if (!GATE_STATUS_VALUES.includes(input.status)) {
    errors.push(`status must be one of: ${GATE_STATUS_VALUES.join(', ')}`);
  }

  if (input.blocker) {
    if (!String(input.blocker.reason || '').trim()) {
      errors.push('blocker.reason is required when blocker is present');
    }

    if (input.blocker.severity && !BLOCKER_SEVERITIES.has(input.blocker.severity)) {
      errors.push('blocker.severity must be one of: critical, high, medium, low');
    }
  }

  if (input.status === 'ready' && input.blocker) {
    errors.push('ready gate status cannot carry an open blocker');
  }

  if (input.status === 'blocked' && !input.blocker) {
    errors.push('blocked gate status requires blocker details');
  }

  if (input.evidence_paths && !Array.isArray(input.evidence_paths)) {
    errors.push('evidence_paths must be an array when provided');
  }

  return errors;
}

export function createGateStatus(input = {}) {
  const gateStatus = {
    gate: input.gate,
    status: input.status || 'pending',
    blocker: input.blocker
      ? {
          reason: input.blocker.reason,
          severity: input.blocker.severity || 'high',
          owner: input.blocker.owner || null
        }
      : null,
    evidence_paths: uniqueList(input.evidence_paths || []),
    notes: input.notes || '',
    owner: input.owner || null
  };

  const errors = validateGateStatus(gateStatus);
  if (errors.length > 0) {
    throw new Error(`Invalid gate status: ${errors.join('; ')}`);
  }

  return Object.freeze(gateStatus);
}
