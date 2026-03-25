// Setup taskstoissues prerequisites — validate tasks.md and GitHub remote
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  getCurrentBranch,
  getDocumentCompletionStatus,
  getFeatureDir,
  getFeaturePathsEnv,
  getRepoRoot,
  hasGit,
  parseArgs,
  testFeatureBranch
} from './common.mjs';

function getGitHubRemoteUrl() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (/github\.com/i.test(remote)) return remote;
    return null;
  } catch {
    return null;
  }
}

function countTaskCards(filePath) {
  if (!existsSync(filePath)) return 0;
  const content = readFileSync(filePath, 'utf8');
  return (content.match(/###\s+(?:BE-T|FE-T|DO-T|CC-T|TC)-\d{3}/g) || []).length;
}

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log('Usage: syskit setup-taskstoissues [OPTIONS]');
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

  // Gate: must have git
  if (!hasGit()) {
    console.error('ERROR: Git is required for taskstoissues.');
    process.exit(1);
  }

  // Gate: must have GitHub remote
  const remoteUrl = getGitHubRemoteUrl();
  if (!remoteUrl) {
    console.error('ERROR: No GitHub remote found. taskstoissues only supports GitHub repositories.');
    process.exit(1);
  }

  // Gate: tasks.md must exist
  const tasksFile = join(featureDir, 'tasks.md');
  const tasksStatus = getDocumentCompletionStatus(tasksFile);
  if (tasksStatus.status === 'not_started') {
    console.error(`ERROR: tasks.md not found in ${featureDir}`);
    console.error('Run /syskit.tasks first to create the task breakdown.');
    process.exit(1);
  }

  const taskCardCount = countTaskCards(tasksFile);
  if (taskCardCount === 0) {
    console.error('ERROR: No valid task cards found in tasks.md.');
    console.error('Tasks must use the Task Card format (e.g., ### BE-T-001).');
    process.exit(1);
  }

  const result = {
    TASKS: tasksFile,
    FEATURES_DIR: featureDir,
    AMINOOOF_DIR: featureDir,
    BRANCH: branch,
    REMOTE_URL: remoteUrl,
    task_card_count: taskCardCount
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const [key, value] of Object.entries(result)) {
      console.log(`${key}: ${value}`);
    }
  }
}
