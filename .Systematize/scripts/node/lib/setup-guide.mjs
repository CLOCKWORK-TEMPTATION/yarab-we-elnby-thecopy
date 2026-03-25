// Setup guide — detect state and recommend next command
import { existsSync } from 'fs';
import { join } from 'path';
import {
  getClarificationStatus,
  getConstitutionStatus,
  getCurrentBranch,
  getDocumentCompletionStatus,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  parseArgs,
  readJsonFile
} from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log('Usage: syskit setup-guide [OPTIONS]');
    console.log('  --branch  Target feature branch');
    console.log('  --json    Output results in JSON format');
    console.log('  --help    Show this help message');
    return;
  }

  const repoRoot = getRepoRoot();
  const paths = getFeaturePathsEnv();
  const branch = opts.branch || paths.CURRENT_BRANCH || getCurrentBranch();
  const featureDir = opts.branch
    ? getFeatureDir(repoRoot, branch)
    : paths.FEATURE_DIR;

  // Check initialization status
  const installState = readJsonFile(join(repoRoot, '.Systematize', 'memory', 'install-state.json'));
  const isInitialized = installState !== null || existsSync(join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'));

  if (!isInitialized) {
    const result = {
      status: 'not_initialized',
      recommended_command: '/syskit.init',
      reason: 'Framework not initialized in this repository.'
    };
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Status: ${result.status}`);
      console.log(`Recommended: ${result.recommended_command}`);
      console.log(`Reason: ${result.reason}`);
    }
    return;
  }

  // Detect feature state
  const featureExists = existsSync(featureDir);
  const phases = {};
  let nextStep = '/syskit.systematize';

  if (featureExists) {
    phases.systematize = existsSync(join(featureDir, 'sys.md')) ? 'complete' : 'not_started';
    phases.clarify = getClarificationStatus(featureDir).status;
    phases.constitution = getConstitutionStatus(repoRoot).status;
    phases.research = getDocumentCompletionStatus(join(featureDir, 'research.md')).status;
    phases.plan = getDocumentCompletionStatus(join(featureDir, 'plan.md')).status;
    phases.tasks = getDocumentCompletionStatus(join(featureDir, 'tasks.md')).status;

    const order = ['systematize', 'clarify', 'constitution', 'research', 'plan', 'tasks'];
    const cmdMap = {
      systematize: '/syskit.systematize',
      clarify: '/syskit.clarify',
      constitution: '/syskit.constitution',
      research: '/syskit.research',
      plan: '/syskit.plan',
      tasks: '/syskit.tasks'
    };

    nextStep = 'complete';
    for (const p of order) {
      if (phases[p] !== 'complete') {
        nextStep = cmdMap[p];
        break;
      }
    }
  }

  const result = {
    status: 'initialized',
    feature_exists: featureExists,
    phases: featureExists ? phases : null,
    recommended_command: nextStep,
    BRANCH: branch
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Status: initialized`);
    console.log(`Feature exists: ${featureExists}`);
    console.log(`Recommended: ${nextStep}`);
  }
}
