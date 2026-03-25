const REQUIRED_REQUEST_FIELDS = [
  'id',
  'branch',
  'source_command',
  'feature_dir',
  'requested_output'
];

function uniqueList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

export function validateReviewRequestContext(input = {}) {
  const errors = [];

  for (const field of REQUIRED_REQUEST_FIELDS) {
    if (!String(input[field] || '').trim()) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (input.paths && typeof input.paths !== 'object') {
    errors.push('paths must be an object when provided');
  }

  if (input.paths) {
    for (const [key, value] of Object.entries(input.paths)) {
      if (!String(value || '').trim()) {
        errors.push(`paths.${key} must be a non-empty path`);
      }
    }
  }

  if (input.required_artifacts && !Array.isArray(input.required_artifacts)) {
    errors.push('required_artifacts must be an array when provided');
  }

  return errors;
}

export function createReviewRequestContext(input = {}) {
  const context = {
    id: input.id,
    branch: input.branch,
    source_command: input.source_command,
    feature_dir: input.feature_dir,
    review_scope: input.review_scope || 'repository',
    requested_output: input.requested_output,
    required_artifacts: uniqueList(input.required_artifacts || []),
    requested_sections: uniqueList(input.requested_sections || []),
    paths: { ...(input.paths || {}) },
    metadata: { ...(input.metadata || {}) }
  };

  const errors = validateReviewRequestContext(context);
  if (errors.length > 0) {
    throw new Error(`Invalid review request context: ${errors.join('; ')}`);
  }

  return Object.freeze(context);
}
