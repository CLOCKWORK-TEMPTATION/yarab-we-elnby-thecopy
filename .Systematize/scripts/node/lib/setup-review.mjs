import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ensureDir,
  getCurrentBranch,
  getDocumentCompletionStatus,
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
  ensureScaffoldFromTemplate,
  detectReviewVerdict,
  failRuntimeContract,
  getRuntimeContract,
  validatePlaceholders,
  validateRequiredSections
} from './command-runtime-contracts.mjs';
import { runReviewPipeline } from './review/pipeline.mjs';
import { writeReviewFile } from './review/write-review-file.mjs';

function buildNextValidationCommand(branch) {
  return `node .Systematize/scripts/node/cli.mjs setup-review --branch ${branch} --validate-existing --json`;
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-review');

  if (opts.help) {
    console.log('Usage: syskit setup-review [OPTIONS]');
    console.log('  --branch             Target feature branch');
    console.log('  --json               Output results in JSON format');
    console.log('  --validate-existing  Validate the populated review gate');
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

  const planFile = join(featureDir, 'plan.md');
  const planStatus = getDocumentCompletionStatus(planFile);
  if (planStatus.status === 'not_started') {
    failRuntimeContract(
      opts,
      'SYSKIT_PLAN_MISSING',
      'missing_plan_file',
      `plan.md not found in ${featureDir}`,
      ['Run /syskit.plan first to create the implementation plan.']
    );
  }

  const tasksFile = join(featureDir, 'tasks.md');
  const tasksStatus = getDocumentCompletionStatus(tasksFile);
  if (tasksStatus.status === 'not_started') {
    failRuntimeContract(
      opts,
      'SYSKIT_TASKS_MISSING',
      'missing_tasks_file',
      `tasks.md not found in ${featureDir}`,
      ['Run /syskit.tasks first to create the task breakdown.']
    );
  }

  const reviewTemplate = resolveTemplate(repoRoot, 'review-template');
  if (!reviewTemplate || !existsSync(reviewTemplate)) {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_TEMPLATE_MISSING',
      'missing_review_template',
      'Review template could not be resolved.'
    );
  }

  const reviewFile = join(featureDir, 'review.md');
  if (!opts['validate-existing']) {
    ensureScaffoldFromTemplate(reviewFile, reviewTemplate);
    const report = runReviewPipeline(repoRoot, {
      branch,
      featureDir,
      sysFile,
      planFile,
      tasksFile,
      reviewFile,
      execute: true
    });
    writeReviewFile(reviewFile, report);
  }

  if (!existsSync(reviewFile)) {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_MISSING',
      'missing_review_artifact',
      'review.md could not be prepared for the active feature.'
    );
  }

  const validationChecks = [
    createValidationCheck(
      'path:feature_sys',
      assertPathWithinFeatureDir(featureDir, sysFile, 'sys.md'),
      'FEATURE_SYS resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:plan',
      assertPathWithinFeatureDir(featureDir, planFile, 'plan.md'),
      'IMPL_PLAN resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:tasks',
      assertPathWithinFeatureDir(featureDir, tasksFile, 'tasks.md'),
      'TASKS resolves inside the active feature workspace'
    ),
    createValidationCheck(
      'path:review',
      assertPathWithinFeatureDir(featureDir, reviewFile, 'review.md'),
      'REVIEW resolves inside the active feature workspace'
    ),
    ...validateRequiredSections(reviewFile, contract.required_output_sections)
  ];

  const placeholderValidation = validatePlaceholders(reviewFile);
  validationChecks.push(...placeholderValidation.checks);

  if (placeholderValidation.unresolved_placeholders.length > 0) {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_PLACEHOLDERS',
      'review_contains_placeholders',
      'Review gate still contains unresolved placeholders.',
      placeholderValidation.unresolved_placeholders
    );
  }

  const reviewVerdict = detectReviewVerdict(reviewFile);
  if (reviewVerdict.status === 'unknown') {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_BLOCKED',
      'review_verdict_unknown',
      'Review gate could not derive a deterministic verdict from review.md.',
      ['Ensure review.md contains a **Verdict** line with APPROVED, APPROVED WITH CONDITIONS, or CHANGES REQUIRED.']
    );
  }
  validationChecks.push(createValidationCheck(
    'review:deterministic_verdict',
    reviewVerdict.status !== 'unknown',
    reviewVerdict.status === 'unknown'
      ? 'Review verdict could not be derived from review.md.'
      : `Review verdict resolved as ${reviewVerdict.verdict}`
  ));

  buildRuntimeSuccessEnvelope({
    opts,
    contract,
    payload: {
      FEATURE_SYS: sysFile,
      IMPL_PLAN: planFile,
      TASKS: tasksFile,
      REVIEW: reviewFile,
      FEATURES_DIR: featureDir,
      FEATURE_DIR: featureDir,
      BRANCH: branch,
      HAS_GIT: paths.HAS_GIT,
      review_verdict: reviewVerdict.verdict
    },
    validationChecks,
    mode: opts['validate-existing'] ? 'validate-existing' : 'setup',
    nextValidationCommand: opts['validate-existing'] ? null : buildNextValidationCommand(branch)
  });
}
