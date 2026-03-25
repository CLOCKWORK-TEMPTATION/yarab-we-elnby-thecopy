import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getArtifactHash,
  getCurrentBranch,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  getTrackedIDs,
  parseArgs,
  readJsonFile
} from './common.mjs';
import {
  buildRuntimeSuccessEnvelope,
  createValidationCheck,
  failRuntimeContract,
  getRuntimeContract
} from './command-runtime-contracts.mjs';

const ARTIFACT_NAMES = ['sys.md', 'plan.md', 'tasks.md', 'research.md', 'AGENTS.md', 'review.md'];

function buildSuggestedCommands(changes) {
  const commands = [];
  const hasSysChange = Object.entries(changes).some(([name, change]) => name === 'sys.md' && change.status !== 'unchanged');
  const hasPlanChange = Object.entries(changes).some(([name, change]) => name === 'plan.md' && change.status !== 'unchanged');
  const hasTasksChange = Object.entries(changes).some(([name, change]) => name === 'tasks.md' && change.status !== 'unchanged');

  if (hasSysChange) commands.push('/syskit.clarify');
  if (hasPlanChange) commands.push('/syskit.review');
  if (hasTasksChange) commands.push('/syskit.implement');
  if (commands.length === 0) commands.push('/syskit.status');

  return commands;
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const contract = getRuntimeContract('setup-diff');

  if (opts.help) {
    console.log('Usage: syskit setup-diff [OPTIONS]');
    console.log('  --branch             Target feature branch');
    console.log('  --snapshot           Snapshot timestamp to compare against');
    console.log('  --require-baseline   Reject when no baseline is available');
    console.log('  --json               Output results in JSON format');
    console.log('  --help               Show this help message');
    return;
  }

  const repoRoot = getRepoRoot();
  const paths = getFeaturePathsEnv();
  const branch = opts.branch || paths.CURRENT_BRANCH || getCurrentBranch();
  const featureDir = opts.branch ? getFeatureDir(repoRoot, branch) : paths.FEATURE_DIR;
  const requireBaseline = opts['require-baseline'] !== false;

  if (!existsSync(featureDir)) {
    failRuntimeContract(
      opts,
      'SYSKIT_FEATURE_DIR_MISSING',
      'missing_feature_workspace',
      `Feature directory not found: ${featureDir}`
    );
  }

  const currentState = {};
  for (const name of ARTIFACT_NAMES) {
    const filePath = join(featureDir, name);
    if (!existsSync(filePath)) continue;
    currentState[name] = {
      hash: getArtifactHash(filePath),
      tracked_ids: getTrackedIDs(filePath)
    };
  }

  if (Object.keys(currentState).length === 0) {
    failRuntimeContract(
      opts,
      'SYSKIT_DIFF_NO_ARTIFACTS',
      'missing_comparable_artifacts',
      `No artifacts found in ${featureDir}`
    );
  }

  const syncStatePath = join(repoRoot, '.Systematize', 'memory', 'sync-state.json');
  const syncState = readJsonFile(syncStatePath);
  const baselineEntry = syncState?.features?.[branch] || null;
  const baselineHashes = baselineEntry?.hashes || null;

  if (!baselineHashes && requireBaseline) {
    failRuntimeContract(
      opts,
      'SYSKIT_DIFF_BASELINE_MISSING',
      'missing_sync_baseline',
      'Diff requires a recorded sync baseline before comparison.',
      ['Run /syskit.sync first, or pass an explicit snapshot once snapshot support is added.']
    );
  }

  const changes = {};
  for (const [name, current] of Object.entries(currentState)) {
    const baselineHash = baselineHashes ? baselineHashes[name] || null : null;
    changes[name] = {
      status: baselineHash === null ? 'new' : baselineHash === current.hash ? 'unchanged' : 'modified',
      current_hash: current.hash,
      baseline_hash: baselineHash,
      tracked_ids: current.tracked_ids,
      id_delta: baselineHash === null
        ? { added: current.tracked_ids, removed: [], kept: [] }
        : null
    };
  }

  const validationChecks = [
    createValidationCheck(
      'feature:exists',
      existsSync(featureDir),
      'Feature workspace exists'
    ),
    createValidationCheck(
      'artifacts:comparable',
      Object.keys(currentState).length > 0,
      'Comparable artifacts were discovered'
    ),
    createValidationCheck(
      'baseline:available',
      !requireBaseline || Boolean(baselineHashes),
      baselineHashes
        ? 'Sync baseline is available'
        : 'Sync baseline is missing'
    )
  ];

  buildRuntimeSuccessEnvelope({
    opts,
    contract,
    payload: {
      FEATURES_DIR: featureDir,
      FEATURE_DIR: featureDir,
      BRANCH: branch,
      HAS_GIT: paths.HAS_GIT,
      artifacts: Object.keys(currentState),
      changes,
      has_baseline: Boolean(baselineHashes),
      suggested_commands: buildSuggestedCommands(changes),
      sync_state_path: existsSync(syncStatePath) ? syncStatePath : null
    },
    validationChecks,
    mode: 'runtime',
    nextValidationCommand: null
  });
}
