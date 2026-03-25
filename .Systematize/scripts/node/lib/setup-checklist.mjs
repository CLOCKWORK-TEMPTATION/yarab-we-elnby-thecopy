import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
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
  failRuntimeContract,
  getRuntimeContract,
  replaceChecklistTemplateMarkers,
  slugifyChecklistDomain,
  validatePlaceholders,
  validateRequiredSections
} from './command-runtime-contracts.mjs';

const CHECKLIST_REQUIRED_SECTIONS = [
  'Checklist:',
  '**Purpose**:',
  '**Created**:',
  '**Feature**:',
  '## Notes'
];

function buildNextValidationCommand(branch, domain) {
  return `node .Systematize/scripts/node/cli.mjs setup-checklist --branch ${branch} --domain ${domain} --validate-existing --json`;
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-checklist');

  if (opts.help) {
    console.log('Usage: syskit setup-checklist [OPTIONS]');
    console.log('  --branch             Target feature branch');
    console.log('  --domain             Checklist domain name');
    console.log('  --json               Output results in JSON format');
    console.log('  --validate-existing  Validate the populated checklist artifact');
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

  const policyPath = join(repoRoot, 'docs', 'policies', 'checklist-policy.md');
  if (!existsSync(policyPath)) {
    failRuntimeContract(
      opts,
      'SYSKIT_POLICY_MISSING',
      'missing_checklist_policy',
      'Checklist policy file not found at docs/policies/checklist-policy.md'
    );
  }

  const sysFile = join(featureDir, 'sys.md');
  if (!existsSync(sysFile)) {
    failRuntimeContract(
      opts,
      'SYSKIT_SYS_MISSING',
      'missing_sys_file',
      `sys.md not found in ${featureDir}`,
      ['Run /syskit.systematize first to create the governing sys document.']
    );
  }

  const checklistTemplate = resolveTemplate(repoRoot, 'checklist-template');
  if (!checklistTemplate || !existsSync(checklistTemplate)) {
    failRuntimeContract(
      opts,
      'SYSKIT_CHECKLIST_TEMPLATE_MISSING',
      'missing_checklist_template',
      'Checklist template could not be resolved.'
    );
  }

  const domain = slugifyChecklistDomain(opts.domain || 'general');
  const checklistsDir = join(featureDir, 'checklists');
  const checklistFile = join(checklistsDir, `${domain}.md`);

  if (!opts['validate-existing']) {
    ensureDir(checklistsDir);
    ensureChecklistScaffold(checklistsDir, checklistFile, checklistTemplate);
    replaceChecklistTemplateMarkers(checklistFile, {
      checklistType: domain.replace(/-/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()),
      featureName: branch,
      featureLink: 'sys.md',
      purpose: `Requirements quality checklist for the ${domain} domain`
    });
  }

  if (!existsSync(checklistFile)) {
    failRuntimeContract(
      opts,
      'SYSKIT_CHECKLIST_MISSING',
      'missing_checklist_artifact',
      `Checklist artifact was not found for domain ${domain}.`
    );
  }

  const validationChecks = [
    createValidationCheck(
      'path:feature_sys',
      assertPathWithinFeatureDir(featureDir, sysFile, 'sys.md'),
      'FEATURE_SYS resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:checklists_dir',
      assertPathWithinFeatureDir(featureDir, checklistsDir, basename(checklistsDir)),
      'CHECKLISTS_DIR resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:checklist_file',
      assertPathWithinFeatureDir(featureDir, checklistFile, `${domain}.md`),
      'CHECKLIST_FILE resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'policy:checklist',
      existsSync(policyPath),
      'Checklist policy file is available'
    ),
    ...validateRequiredSections(checklistFile, CHECKLIST_REQUIRED_SECTIONS)
  ];

  if (opts['validate-existing']) {
    const placeholderValidation = validatePlaceholders(checklistFile);
    validationChecks.push(...placeholderValidation.checks);

    if (placeholderValidation.unresolved_placeholders.length > 0) {
      failRuntimeContract(
        opts,
        'SYSKIT_CHECKLIST_PLACEHOLDERS',
        'checklist_contains_placeholders',
        'Checklist artifact still contains unresolved placeholders.',
        placeholderValidation.unresolved_placeholders
      );
    }
  }

  buildRuntimeSuccessEnvelope({
    opts,
    contract,
    payload: {
      FEATURE_SYS: sysFile,
      CHECKLISTS_DIR: checklistsDir,
      CHECKLIST_FILE: checklistFile,
      CHECKLIST_DOMAIN: domain,
      FEATURES_DIR: featureDir,
      FEATURE_DIR: featureDir,
      BRANCH: branch,
      HAS_GIT: paths.HAS_GIT,
      POLICY_PATH: policyPath
    },
    validationChecks,
    mode: opts['validate-existing'] ? 'validate-existing' : 'setup',
    nextValidationCommand: opts['validate-existing'] ? null : buildNextValidationCommand(branch, domain)
  });
}
