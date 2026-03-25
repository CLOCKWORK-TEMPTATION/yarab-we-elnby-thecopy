export const FINDING_TYPES = Object.freeze([
  'confirmed_error',
  'potential_risk',
  'design_weakness',
  'documentation_drift',
  'execution_gap',
  'out_of_scope'
]);

export const FINDING_SEVERITIES = Object.freeze([
  'critical',
  'high',
  'medium',
  'low'
]);

export const FINDING_LAYERS = Object.freeze([
  'config',
  'toolchain',
  'documentation_drift',
  'server',
  'shared',
  'frontend',
  'integration',
  'security',
  'performance',
  'production',
  'editor_subtree',
  'backend',
  'shared_packages',
  'frontend_backend_integration',
  'security_production_readiness',
  'automated_checks',
  'toolchain_workspace'
]);

function uniqueList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

export function validateFinding(input = {}) {
  const errors = [];

  if (!String(input.id || '').trim()) {
    errors.push('id is required');
  }

  if (!FINDING_TYPES.includes(input.type)) {
    errors.push(`type must be one of: ${FINDING_TYPES.join(', ')}`);
  }

  if (!FINDING_SEVERITIES.includes(input.severity)) {
    errors.push(`severity must be one of: ${FINDING_SEVERITIES.join(', ')}`);
  }

  if (!FINDING_LAYERS.includes(input.layer)) {
    errors.push(`layer must be one of: ${FINDING_LAYERS.join(', ')}`);
  }

  for (const field of ['location', 'problem', 'evidence', 'impact', 'fix']) {
    if (!String(input[field] || '').trim()) {
      errors.push(`${field} is required`);
    }
  }

  if (input.evidence_refs && !Array.isArray(input.evidence_refs)) {
    errors.push('evidence_refs must be an array when provided');
  }

  return errors;
}

export function createFinding(input = {}) {
  const finding = {
    id: input.id,
    type: input.type,
    severity: input.severity,
    layer: input.layer,
    location: input.location,
    problem: input.problem,
    evidence: input.evidence,
    impact: input.impact,
    fix: input.fix,
    evidence_refs: uniqueList(input.evidence_refs || [])
  };

  const errors = validateFinding(finding);
  if (errors.length > 0) {
    throw new Error(`Invalid finding: ${errors.join('; ')}`);
  }

  return Object.freeze(finding);
}

export function buildFindingSignature(finding) {
  return [
    finding.type,
    finding.severity,
    finding.layer,
    finding.location,
    finding.problem
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .join('::');
}
