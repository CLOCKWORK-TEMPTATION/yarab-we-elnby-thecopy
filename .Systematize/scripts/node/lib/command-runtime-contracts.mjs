import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import {
  ensureDir,
  findUnresolvedPlaceholders,
  getClarificationStatus
} from './common.mjs';

const RUNTIME_CONTRACTS = {
  'setup-systematize': {
    execution_mode: 'strong-hybrid',
    visibility: 'primary',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      'validate-existing': { type: 'boolean', required: false }
    },
    required_output_sections: [
      '## Product Card',
      '## Clarification Contract',
      '## Level 3: Requirements',
      '## Traceability Matrix',
      '## Quality Audit'
    ],
    artifact_path_rules: [
      'FEATURE_SYS must resolve to FEATURES_DIR/sys.md',
      'REQUIREMENTS_CHECKLIST must resolve to FEATURES_DIR/checklists/requirements.md'
    ],
    acceptance_validator: 'validateSystematizeArtifacts',
    error_codes: [
      'SYSKIT_BRANCH_INVALID',
      'SYSKIT_POLICY_MISSING',
      'SYSKIT_TEMPLATE_MISSING',
      'SYSKIT_SYS_MISSING',
      'SYSKIT_SYS_PLACEHOLDERS',
      'SYSKIT_REQUIREMENTS_CHECKLIST_MISSING'
    ]
  },
  'setup-clarify': {
    execution_mode: 'strong-hybrid',
    visibility: 'primary',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      'validate-existing': { type: 'boolean', required: false }
    },
    required_output_sections: [
      '### What Is Required',
      '### What Is NOT Required',
      '### Constraints',
      '### Assumptions',
      '### Critical Questions Resolved',
      '### Clarification Checklist'
    ],
    artifact_path_rules: [
      'FEATURE_SYS must resolve to FEATURES_DIR/sys.md',
      'Clarification Contract must remain inside sys.md'
    ],
    acceptance_validator: 'validateClarificationContract',
    error_codes: [
      'SYSKIT_BRANCH_INVALID',
      'SYSKIT_POLICY_MISSING',
      'SYSKIT_SYS_MISSING',
      'SYSKIT_CLARIFY_SECTION_MISSING',
      'SYSKIT_CLARIFY_INCOMPLETE'
    ]
  },
  'setup-checklist': {
    execution_mode: 'runtime-backed',
    visibility: 'optional',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      domain: { type: 'string', required: false, default: 'general' },
      'validate-existing': { type: 'boolean', required: false }
    },
    required_output_sections: [
      '# [CHECKLIST TYPE] Checklist: [FEATURE NAME]',
      '**Purpose**:',
      '**Created**:',
      '**Feature**:'
    ],
    artifact_path_rules: [
      'CHECKLISTS_DIR must resolve inside FEATURES_DIR/checklists',
      'CHECKLIST_FILE must resolve to CHECKLISTS_DIR/<domain>.md'
    ],
    acceptance_validator: 'validateChecklistArtifact',
    error_codes: [
      'SYSKIT_BRANCH_INVALID',
      'SYSKIT_POLICY_MISSING',
      'SYSKIT_SYS_MISSING',
      'SYSKIT_CHECKLIST_TEMPLATE_MISSING',
      'SYSKIT_CHECKLIST_MISSING',
      'SYSKIT_CHECKLIST_PLACEHOLDERS'
    ]
  },
  'setup-review': {
    execution_mode: 'strong-hybrid',
    visibility: 'primary',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      'validate-existing': { type: 'boolean', required: false }
    },
    required_output_sections: [
      '## Executive Summary',
      '## Critical Issues Table',
      '## Layer-by-Layer Findings',
      '### Toolchain and Workspace',
      '### Automated Checks',
      '### Documentation Drift',
      '### Frontend',
      '### Editor Subtree',
      '### Backend',
      '### Shared Packages',
      '### Frontend–Backend Integration',
      '### Security and Production Readiness',
      '## Confidence and Coverage',
      '## Repair Priority Map',
      '## Action Plan'
    ],
    artifact_path_rules: [
      'FEATURE_SYS must resolve to FEATURES_DIR/sys.md',
      'IMPL_PLAN must resolve to FEATURES_DIR/plan.md',
      'TASKS must resolve to FEATURES_DIR/tasks.md',
      'REVIEW must resolve to FEATURES_DIR/review.md'
    ],
    acceptance_validator: 'validateReviewGateArtifact',
    error_codes: [
      'SYSKIT_BRANCH_INVALID',
      'SYSKIT_SYS_MISSING',
      'SYSKIT_PLAN_MISSING',
      'SYSKIT_TASKS_MISSING',
      'SYSKIT_REVIEW_TEMPLATE_MISSING',
      'SYSKIT_REVIEW_MISSING',
      'SYSKIT_REVIEW_PLACEHOLDERS'
    ]
  },
  'setup-implement': {
    execution_mode: 'strong-hybrid',
    visibility: 'primary',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      'allow-incomplete-checklists': { type: 'boolean', required: false }
    },
    required_output_sections: [
      'Execution plan',
      'Completed tasks',
      'Failed tasks',
      'Build and test status',
      'Post-run verification summary'
    ],
    artifact_path_rules: [
      'FEATURE_SYS must resolve to FEATURES_DIR/sys.md',
      'IMPL_PLAN must resolve to FEATURES_DIR/plan.md',
      'TASKS must resolve to FEATURES_DIR/tasks.md',
      'REVIEW must resolve to FEATURES_DIR/review.md'
    ],
    acceptance_validator: 'validateImplementationGate',
    error_codes: [
      'SYSKIT_BRANCH_INVALID',
      'SYSKIT_SYS_MISSING',
      'SYSKIT_PLAN_MISSING',
      'SYSKIT_TASKS_MISSING',
      'SYSKIT_REVIEW_MISSING',
      'SYSKIT_REVIEW_BLOCKED',
      'SYSKIT_CHECKLISTS_INCOMPLETE'
    ]
  },
  'setup-diff': {
    execution_mode: 'runtime-backed',
    visibility: 'optional',
    input_schema: {
      branch: { type: 'string', required: false, pattern: '^\\d{3}-[a-z0-9-]+$' },
      json: { type: 'boolean', required: false },
      snapshot: { type: 'string', required: false },
      'require-baseline': { type: 'boolean', required: false, default: true }
    },
    required_output_sections: [
      'Artifact delta',
      'ID delta',
      'Impact analysis',
      'Suggested commands'
    ],
    artifact_path_rules: [
      'FEATURES_DIR must resolve to the active feature workspace',
      'Baseline must be read from sync-state.json or an explicit snapshot'
    ],
    acceptance_validator: 'validateDiffInputs',
    error_codes: [
      'SYSKIT_FEATURE_DIR_MISSING',
      'SYSKIT_DIFF_NO_ARTIFACTS',
      'SYSKIT_DIFF_BASELINE_MISSING'
    ]
  }
};

const GENERIC_PLACEHOLDER_PATTERN = /\[(?![ xX]\])(?:[A-Za-z][A-Za-z0-9 _./:-]{1,}|[A-Z0-9 _./:-]{2,})\]/g;
const ALLOWED_NEEDS_CLARIFICATION_PATTERN = /\[NEEDS CLARIFICATION:[^\]]+\]/g;

function normalizeRelativePath(pathValue) {
  return pathValue.replace(/\\/g, '/');
}

export function getRuntimeContract(commandName) {
  const contract = RUNTIME_CONTRACTS[commandName];
  if (!contract) {
    throw new Error(`Unknown runtime contract: ${commandName}`);
  }

  return {
    command_name: commandName,
    ...contract
  };
}

export function createValidationCheck(name, passed, details, severity = 'error') {
  return {
    name,
    status: passed ? 'passed' : 'failed',
    severity,
    details
  };
}

export function summarizePerformedChecks(checks) {
  return checks.filter((check) => check.status === 'passed').map((check) => check.name);
}

export function assertPathWithinFeatureDir(featureDir, filePath, expectedBaseName) {
  const relativePath = normalizeRelativePath(relative(featureDir, filePath));
  return !relativePath.startsWith('..')
    && basename(filePath) === expectedBaseName;
}

export function collectTemplatePlaceholders(content, options = {}) {
  const allowedPatterns = options.allowedPatterns || [];
  const needsClarificationMatches = content.match(ALLOWED_NEEDS_CLARIFICATION_PATTERN) || [];
  const rawMatches = [
    ...(content.match(GENERIC_PLACEHOLDER_PATTERN) || []),
    ...findUnresolvedPlaceholders(content)
  ];

  return [...new Set(rawMatches)]
    .filter((match) => !needsClarificationMatches.includes(match))
    .filter((match) => !allowedPatterns.some((pattern) => pattern.test(match)));
}

export function validateRequiredSections(filePath, requiredSections) {
  if (!existsSync(filePath)) {
    return requiredSections.map((section) => createValidationCheck(section, false, `Missing file: ${filePath}`));
  }

  const content = readFileSync(filePath, 'utf8');
  return requiredSections.map((section) => createValidationCheck(
    `section:${section}`,
    content.includes(section),
    content.includes(section)
      ? `Found required section in ${normalizeRelativePath(filePath)}`
      : `Missing required section "${section}" in ${normalizeRelativePath(filePath)}`
  ));
}

export function validatePlaceholders(filePath, options = {}) {
  if (!existsSync(filePath)) {
    return {
      checks: [createValidationCheck('placeholders:file_exists', false, `Missing file: ${filePath}`)],
      unresolved_placeholders: []
    };
  }

  const content = readFileSync(filePath, 'utf8');
  const unresolvedPlaceholders = collectTemplatePlaceholders(content, options);
  return {
    checks: [
      createValidationCheck(
        'placeholders:resolved',
        unresolvedPlaceholders.length === 0,
        unresolvedPlaceholders.length === 0
          ? `No unresolved placeholders in ${normalizeRelativePath(filePath)}`
          : `Unresolved placeholders in ${normalizeRelativePath(filePath)}: ${unresolvedPlaceholders.join(', ')}`
      )
    ],
    unresolved_placeholders: unresolvedPlaceholders
  };
}

export function validateNeedsClarificationCount(filePath, maxCount) {
  if (!existsSync(filePath)) {
    return createValidationCheck('needs_clarification:file_exists', false, `Missing file: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf8');
  const matches = content.match(ALLOWED_NEEDS_CLARIFICATION_PATTERN) || [];
  return createValidationCheck(
    'needs_clarification:count',
    matches.length <= maxCount,
    matches.length <= maxCount
      ? `Needs clarification markers within limit (${matches.length}/${maxCount})`
      : `Needs clarification markers exceeded limit (${matches.length}/${maxCount})`
  );
}

export function ensureScaffoldFromTemplate(outputPath, templatePath) {
  if (existsSync(outputPath)) return false;
  ensureDir(dirname(outputPath));
  copyFileSync(templatePath, outputPath);
  return true;
}

export function ensureChecklistScaffold(checklistsDir, checklistFile, templatePath) {
  ensureDir(checklistsDir);

  if (existsSync(checklistFile)) {
    return false;
  }

  copyFileSync(templatePath, checklistFile);
  return true;
}

export function slugifyChecklistDomain(rawValue = 'general') {
  return String(rawValue)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'general';
}

export function listChecklistFiles(checklistsDir) {
  if (!existsSync(checklistsDir)) return [];
  return readdirSync(checklistsDir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(checklistsDir, entry))
    .sort();
}

export function countChecklistItems(content) {
  const total = (content.match(/^- \[(?: |x|X)\]/gm) || []).length;
  const completed = (content.match(/^- \[(?:x|X)\]/gm) || []).length;
  return {
    total,
    completed,
    incomplete: total - completed
  };
}

export function detectReviewVerdict(reviewPath) {
  if (!existsSync(reviewPath)) {
    return { status: 'missing', verdict: null };
  }

  const content = readFileSync(reviewPath, 'utf8');
  const verdictMatch = content.match(/\*\*Verdict\*\*:\s*(.+)/);
  const normalized = verdictMatch ? verdictMatch[1].trim() : '';

  if (/CHANGES REQUIRED/i.test(normalized)) {
    return { status: 'blocked', verdict: normalized };
  }

  if (/APPROVED WITH CONDITIONS/i.test(normalized) || /APPROVED/i.test(normalized)) {
    return { status: 'accepted', verdict: normalized };
  }

  return { status: 'unknown', verdict: normalized || null };
}

export function buildChecklistSummary(checklistsDir) {
  return listChecklistFiles(checklistsDir).map((filePath) => {
    const counts = countChecklistItems(readFileSync(filePath, 'utf8'));
    return {
      file: normalizeRelativePath(filePath),
      ...counts,
      status: counts.incomplete === 0 ? 'pass' : 'fail'
    };
  });
}

export function buildRuntimeSuccessEnvelope({
  opts,
  contract,
  payload,
  validationChecks,
  mode,
  nextValidationCommand
}) {
  const result = {
    ...payload,
    runtime_contract: contract,
    validation: {
      mode,
      status: validationChecks.every((check) => check.status === 'passed') ? 'accepted' : 'rejected',
      performed_checks: validationChecks
    },
    post_run_verification: {
      mode,
      performed: summarizePerformedChecks(validationChecks),
      next_validation_command: nextValidationCommand || null
    }
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'object' && value !== null) {
      console.log(`${key}: ${JSON.stringify(value)}`);
      continue;
    }

    console.log(`${key}: ${value}`);
  }
}

export function failRuntimeContract(opts, code, rejectionReason, message, details = []) {
  const payload = {
    status: 'rejected',
    error_code: code,
    rejection_reason: rejectionReason,
    message,
    details
  };

  if (opts.json) {
    console.error(JSON.stringify(payload, null, 2));
  } else {
    console.error(`ERROR[${code}]: ${message}`);
    if (rejectionReason) {
      console.error(`REJECTION_REASON: ${rejectionReason}`);
    }

    for (const detail of details) {
      console.error(`DETAIL: ${detail}`);
    }
  }

  process.exit(1);
}

export function validateClarificationCompletion(sysFile) {
  const clarificationStatus = getClarificationStatus(dirname(sysFile));
  return createValidationCheck(
    'clarification:complete',
    clarificationStatus.status === 'complete',
    clarificationStatus.status === 'complete'
      ? 'Clarification Contract is complete'
      : 'Clarification Contract is incomplete'
  );
}

export function replaceChecklistTemplateMarkers(checklistPath, replacements = {}) {
  if (!existsSync(checklistPath)) return;

  const content = readFileSync(checklistPath, 'utf8');
  const nextContent = content
    .replace(/\[CHECKLIST TYPE\]/g, replacements.checklistType || 'General')
    .replace(/\[FEATURE NAME\]/g, replacements.featureName || 'Feature')
    .replace(/\[DATE\]/g, replacements.date || new Date().toISOString().slice(0, 10))
    .replace(/\[Link to sys\.md or relevant documentation\]/g, replacements.featureLink || 'sys.md')
    .replace(/\[Brief description of what this checklist covers\]/g, replacements.purpose || 'Requirements quality review');

  if (nextContent !== content) {
    writeFileSync(checklistPath, nextContent, 'utf8');
  }
}
