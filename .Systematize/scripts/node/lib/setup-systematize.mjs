import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ensureDir,
  getCurrentBranch,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  parseArgs,
  resolveTemplate,
  testFeatureBranch
} from './common.mjs';
import {
  assertPathWithinFeatureDir,
  buildRuntimeSuccessEnvelope,
  createValidationCheck,
  ensureChecklistScaffold,
  ensureScaffoldFromTemplate,
  failRuntimeContract,
  getRuntimeContract,
  replaceChecklistTemplateMarkers,
  validateNeedsClarificationCount,
  validatePlaceholders,
  validateRequiredSections
} from './command-runtime-contracts.mjs';

const REQUIREMENTS_CHECKLIST_SECTIONS = [
  '# Requirements Checklist:',
  '**Purpose**:',
  '**Created**:',
  '**Feature**:',
  '## Notes'
];

function buildNextValidationCommand(branch) {
  return `node .Systematize/scripts/node/cli.mjs setup-systematize --branch ${branch} --validate-existing --json`;
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-systematize');

  if (opts.help) {
    console.log('Usage: syskit setup-systematize [OPTIONS]');
    console.log('  --branch             Target feature branch');
    console.log('  --json               Output results in JSON format');
    console.log('  --validate-existing  Validate the populated artifacts');
    console.log('  --help               Show this help message');
    return;
  }

  const repoRoot = getRepoRoot();
  const paths = getFeaturePathsEnv({ mutating: true, ensureExists: true });
  const branch = opts.branch || paths.CURRENT_BRANCH || getCurrentBranch();
  const featureDir = opts.branch
    ? getFeatureDir(repoRoot, branch, { mutating: true, ensureExists: true })
    : paths.FEATURE_DIR;

  if (!testFeatureBranch(branch) && paths.HAS_GIT) {
    failRuntimeContract(
      opts,
      'SYSKIT_BRANCH_INVALID',
      'invalid_feature_branch',
      'Not on a feature branch.',
      ['Feature branches should be named like: 001-feature-name']
    );
  }

  ensureDir(featureDir);

  const policyPath = join(repoRoot, 'docs', 'policies', 'systematize-policy.md');
  if (!existsSync(policyPath)) {
    failRuntimeContract(
      opts,
      'SYSKIT_POLICY_MISSING',
      'missing_systematize_policy',
      'Systematize policy file not found at docs/policies/systematize-policy.md'
    );
  }

  const sysTemplate = resolveTemplate(repoRoot, 'sys-template');
  if (!sysTemplate || !existsSync(sysTemplate)) {
    failRuntimeContract(
      opts,
      'SYSKIT_TEMPLATE_MISSING',
      'missing_sys_template',
      'Systematize template could not be resolved.'
    );
  }

  const checklistTemplate = resolveTemplate(repoRoot, 'checklist-template');
  if (!checklistTemplate || !existsSync(checklistTemplate)) {
    failRuntimeContract(
      opts,
      'SYSKIT_TEMPLATE_MISSING',
      'missing_checklist_template',
      'Checklist template could not be resolved.'
    );
  }

  const sysFile = join(featureDir, 'sys.md');
  const checklistsDir = join(featureDir, 'checklists');
  const requirementsChecklist = join(checklistsDir, 'requirements.md');

  if (!opts['validate-existing']) {
    ensureScaffoldFromTemplate(sysFile, sysTemplate);
    ensureChecklistScaffold(checklistsDir, requirementsChecklist, checklistTemplate);
    replaceChecklistTemplateMarkers(requirementsChecklist, {
      checklistType: 'Requirements',
      featureName: branch,
      featureLink: 'sys.md',
      purpose: 'Validate systematize output quality before clarification'
    });
  }

  if (!existsSync(sysFile)) {
    failRuntimeContract(
      opts,
      'SYSKIT_SYS_MISSING',
      'missing_sys_file',
      'sys.md could not be prepared for the active feature.'
    );
  }

  if (!existsSync(requirementsChecklist)) {
    failRuntimeContract(
      opts,
      'SYSKIT_REQUIREMENTS_CHECKLIST_MISSING',
      'missing_requirements_checklist',
      'requirements.md checklist could not be prepared for the active feature.'
    );
  }

  const validationChecks = [
    createValidationCheck(
      'path:feature_sys',
      assertPathWithinFeatureDir(featureDir, sysFile, 'sys.md'),
      'FEATURE_SYS resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:requirements_checklist',
      assertPathWithinFeatureDir(featureDir, requirementsChecklist, 'requirements.md'),
      'REQUIREMENTS_CHECKLIST resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'policy:systematize',
      existsSync(policyPath),
      'Systematize policy file is available'
    ),
    ...validateRequiredSections(sysFile, contract.required_output_sections),
    ...validateRequiredSections(requirementsChecklist, REQUIREMENTS_CHECKLIST_SECTIONS)
  ];

  if (opts['validate-existing']) {
    const sysPlaceholderValidation = validatePlaceholders(sysFile);
    const checklistPlaceholderValidation = validatePlaceholders(requirementsChecklist);

    validationChecks.push(...sysPlaceholderValidation.checks);
    validationChecks.push(...checklistPlaceholderValidation.checks);
    validationChecks.push(validateNeedsClarificationCount(sysFile, 3));

    const unresolved = [
      ...sysPlaceholderValidation.unresolved_placeholders,
      ...checklistPlaceholderValidation.unresolved_placeholders
    ];

    if (unresolved.length > 0) {
      failRuntimeContract(
        opts,
        'SYSKIT_SYS_PLACEHOLDERS',
        'unresolved_systematize_placeholders',
        'Systematize artifacts still contain unresolved placeholders.',
        unresolved
      );
    }
  }

  buildRuntimeSuccessEnvelope({
    opts,
    contract,
    payload: {
      FEATURE_SYS: sysFile,
      REQUIREMENTS_CHECKLIST: requirementsChecklist,
      FEATURES_DIR: featureDir,
      FEATURE_DIR: featureDir,
      BRANCH: branch,
      HAS_GIT: paths.HAS_GIT,
      POLICY_PATH: policyPath
    },
    validationChecks,
    mode: opts['validate-existing'] ? 'validate-existing' : 'setup',
    nextValidationCommand: opts['validate-existing'] ? null : buildNextValidationCommand(branch)
  });
}
