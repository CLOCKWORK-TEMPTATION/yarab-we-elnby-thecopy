// فحص المتطلبات — مكافئ check-prerequisites.ps1
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getFeaturePathsEnv, parseArgs } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit check-prerequisites [OPTIONS]

Consolidated prerequisite checking for Sys-Driven Development workflow.

OPTIONS:
  --json               Output in JSON format
  --require-tasks      Require tasks.md to exist (for implementation phase)
  --include-tasks      Include tasks.md in AVAILABLE_DOCS list
  --paths-only         Only output path variables (no validation)
  --help, -h           Show this help message

EXAMPLES:
  node cli.mjs check-prerequisites --json
  node cli.mjs check-prerequisites --json --require-tasks --include-tasks
  node cli.mjs check-prerequisites --paths-only`);
    return;
  }

  const env = getFeaturePathsEnv();

  // PathsOnly mode — output paths and exit
  if (opts['paths-only']) {
    if (opts.json) {
      console.log(JSON.stringify({
        REPO_ROOT: env.REPO_ROOT,
        BRANCH: env.CURRENT_BRANCH,
        FEATURE_DIR: env.FEATURE_DIR,
        FEATURE_SYS: env.FEATURE_SYS,
        IMPL_PLAN: env.IMPL_PLAN,
        TASKS: env.TASKS,
      }));
    } else {
      console.log(`REPO_ROOT: ${env.REPO_ROOT}`);
      console.log(`BRANCH: ${env.CURRENT_BRANCH}`);
      console.log(`FEATURE_DIR: ${env.FEATURE_DIR}`);
      console.log(`FEATURE_SYS: ${env.FEATURE_SYS}`);
      console.log(`IMPL_PLAN: ${env.IMPL_PLAN}`);
      console.log(`TASKS: ${env.TASKS}`);
    }
    return;
  }

  // Validate feature directory
  if (!existsSync(env.FEATURE_DIR)) {
    console.error(`ERROR: Feature directory not found: ${env.FEATURE_DIR}`);
    console.error('Run /syskit.systematize first to create the feature structure.');
    process.exit(1);
  }

  // tasks.md implies plan.md for the implementation phase, while earlier
  // phases should still be able to resolve the active feature workspace.
  if (opts['require-tasks'] && !existsSync(env.IMPL_PLAN)) {
    console.error(`ERROR: plan.md not found in ${env.FEATURE_DIR}`);
    console.error('Run /syskit.plan first to create the implementation plan.');
    process.exit(1);
  }

  if (opts['require-tasks'] && !existsSync(env.TASKS)) {
    console.error(`ERROR: tasks.md not found in ${env.FEATURE_DIR}`);
    console.error('Run /syskit.tasks first to create the task list.');
    process.exit(1);
  }

  // Build list of available documents
  const docs = [];
  if (existsSync(env.RESEARCH)) docs.push('research.md');
  if (existsSync(env.AGENTS_MD)) docs.push('AGENTS.md');

  // Check contracts directory
  if (existsSync(env.CONTRACTS_DIR)) {
    try {
      const contractFiles = readdirSync(env.CONTRACTS_DIR);
      if (contractFiles.length > 0) docs.push('contracts/');
    } catch { /* skip */ }
  }

  if (existsSync(env.QUICKSTART)) docs.push('quickstart.md');

  // Include tasks.md if requested and exists
  if (opts['include-tasks'] && existsSync(env.TASKS)) {
    docs.push('tasks.md');
  }

  // Output
  if (opts.json) {
    console.log(JSON.stringify({ FEATURE_DIR: env.FEATURE_DIR, AVAILABLE_DOCS: docs }));
  } else {
    console.log(`FEATURE_DIR:${env.FEATURE_DIR}`);
    console.log('AVAILABLE_DOCS:');
    const checkFile = (path, name) => {
      const exists = existsSync(path);
      console.log(`  ${exists ? '✓' : '✗'} ${name}`);
    };
    checkFile(env.RESEARCH, 'research.md');
    checkFile(env.AGENTS_MD, 'AGENTS.md');
    const contractsExist = existsSync(env.CONTRACTS_DIR) && (() => { try { return readdirSync(env.CONTRACTS_DIR).length > 0; } catch { return false; } })();
    console.log(`  ${contractsExist ? '✓' : '✗'} contracts/`);
    checkFile(env.QUICKSTART, 'quickstart.md');
    if (opts['include-tasks']) {
      checkFile(env.TASKS, 'tasks.md');
    }
  }
}
