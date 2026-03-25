import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ensureDir,
  getCurrentBranch,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  parseArgs,
  testFeatureBranch
} from './common.mjs';
import {
  assertPathWithinFeatureDir,
  buildRuntimeSuccessEnvelope,
  createValidationCheck,
  failRuntimeContract,
  getRuntimeContract,
  validateClarificationCompletion,
  validatePlaceholders,
  validateRequiredSections
} from './command-runtime-contracts.mjs';

function buildNextValidationCommand(branch) {
  return `node .Systematize/scripts/node/cli.mjs setup-clarify --branch ${branch} --validate-existing --json`;
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-clarify');

  if (opts.help) {
    console.log('Usage: syskit setup-clarify [OPTIONS]');
    console.log('  --branch             Target feature branch');
    console.log('  --json               Output results in JSON format');
    console.log('  --validate-existing  Validate the populated Clarification Contract');
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

  const policyPath = join(repoRoot, 'docs', 'policies', 'clarify-policy.md');
  if (!existsSync(policyPath)) {
    failRuntimeContract(
      opts,
      'SYSKIT_POLICY_MISSING',
      'missing_clarify_policy',
      'Clarify policy file not found at docs/policies/clarify-policy.md'
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

  const validationChecks = [
    createValidationCheck(
      'path:feature_sys',
      assertPathWithinFeatureDir(featureDir, sysFile, 'sys.md'),
      'FEATURE_SYS resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'policy:clarify',
      existsSync(policyPath),
      'Clarify policy file is available'
    ),
    ...validateRequiredSections(sysFile, contract.required_output_sections)
  ];

  if (opts['validate-existing']) {
    const placeholderValidation = validatePlaceholders(sysFile, {
      allowedPatterns: [/^\[NEEDS CLARIFICATION:[^\]]+\]$/]
    });
    validationChecks.push(...placeholderValidation.checks);
    validationChecks.push(validateClarificationCompletion(sysFile));

    if (placeholderValidation.unresolved_placeholders.length > 0) {
      failRuntimeContract(
        opts,
        'SYSKIT_CLARIFY_INCOMPLETE',
        'clarification_contract_contains_placeholders',
        'Clarification Contract still contains unresolved placeholders.',
        placeholderValidation.unresolved_placeholders
      );
    }
  }

  buildRuntimeSuccessEnvelope({
    opts,
    contract,
    payload: {
      FEATURE_SYS: sysFile,
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
