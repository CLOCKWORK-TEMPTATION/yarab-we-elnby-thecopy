import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ensureDir,
  getCurrentBranch,
  getDocumentCompletionStatus,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  parseArgs,
  testFeatureBranch
} from './common.mjs';
import {
  assertPathWithinFeatureDir,
  buildChecklistSummary,
  buildRuntimeSuccessEnvelope,
  createValidationCheck,
  detectReviewVerdict,
  failRuntimeContract,
  getRuntimeContract
} from './command-runtime-contracts.mjs';

function buildChecklistWarning(summary) {
  const failing = summary.filter((item) => item.status === 'fail');
  if (failing.length === 0) return null;
  return failing.map((item) => `${item.file} has ${item.incomplete} incomplete items`).join('; ');
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-implement');

  if (opts.help) {
    console.log('Usage: syskit setup-implement [OPTIONS]');
    console.log('  --branch                      Target feature branch');
    console.log('  --json                        Output results in JSON format');
    console.log('  --allow-incomplete-checklists Continue when checklist items remain open');
    console.log('  --help                        Show this help message');
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

  const reviewFile = join(featureDir, 'review.md');
  if (!existsSync(reviewFile)) {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_MISSING',
      'missing_review_gate',
      `review.md not found in ${featureDir}`,
      ['Run /syskit.review first to create the review gate artifact.']
    );
  }

  const reviewVerdict = detectReviewVerdict(reviewFile);
  if (reviewVerdict.status === 'blocked') {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_BLOCKED',
      'review_gate_blocked',
      'Implementation cannot start while the review gate is blocked.',
      [reviewVerdict.verdict || 'Review verdict is CHANGES REQUIRED']
    );
  }

  if (reviewVerdict.status === 'unknown') {
    failRuntimeContract(
      opts,
      'SYSKIT_REVIEW_BLOCKED',
      'review_gate_unknown',
      'Implementation requires a deterministic review verdict before execution.',
      ['Populate review.md with APPROVED or APPROVED WITH CONDITIONS.']
    );
  }

  const checklistsDir = join(featureDir, 'checklists');
  const checklistSummary = buildChecklistSummary(checklistsDir);
  const checklistWarning = buildChecklistWarning(checklistSummary);
  if (checklistWarning && !opts['allow-incomplete-checklists']) {
    failRuntimeContract(
      opts,
      'SYSKIT_CHECKLISTS_INCOMPLETE',
      'incomplete_checklist_gate',
      'Checklist gate is not satisfied for implementation.',
      checklistSummary.map((item) => `${item.file}: ${item.incomplete} incomplete`)
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
    createValidationCheck(
      'review:verdict',
      reviewVerdict.status === 'accepted',
      `Review verdict accepted: ${reviewVerdict.verdict || 'APPROVED'}`
    ),
    createValidationCheck(
      'tasks:non_empty',
      readFileSync(tasksFile, 'utf8').trim().length > 0,
      'tasks.md is non-empty'
    )
  ];

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
      review_verdict: reviewVerdict.verdict,
      checklist_warning: checklistWarning,
      checklist_summary: checklistSummary
    },
    validationChecks,
    mode: 'setup',
    nextValidationCommand: 'npm run verify'
  });
}
