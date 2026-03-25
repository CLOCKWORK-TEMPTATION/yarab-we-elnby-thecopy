import { execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { getRepoRoot, parseArgs } from './common.mjs';

const HOOK_SOURCE_RELATIVE_PATH = join('.Systematize', 'scripts', 'hooks', 'pre-commit');

function getActiveHooksDirectory(repoRoot) {
  try {
    const gitHooksPath = execSync('git rev-parse --git-path hooks', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    return resolve(repoRoot, gitHooksPath);
  } catch {
    return null;
  }
}

function installPreCommitHook(repoRoot) {
  const hookSourcePath = join(repoRoot, HOOK_SOURCE_RELATIVE_PATH);
  if (!existsSync(hookSourcePath)) {
    throw new Error(`Missing tracked hook source: ${HOOK_SOURCE_RELATIVE_PATH}`);
  }

  const hooksDirectory = getActiveHooksDirectory(repoRoot);
  if (!hooksDirectory) {
    return {
      status: 'skipped',
      reason: 'git-hooks-unavailable'
    };
  }

  mkdirSync(hooksDirectory, { recursive: true });
  const hookTargetPath = join(hooksDirectory, 'pre-commit');
  const sourceContent = readFileSync(hookSourcePath, 'utf8').replace(/\r\n/g, '\n');
  writeFileSync(hookTargetPath, sourceContent, 'utf8');
  chmodSync(hookTargetPath, 0o755);

  return {
    status: 'installed',
    source: hookSourcePath,
    target: hookTargetPath
  };
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  const repoRoot = getRepoRoot();

  if (opts.help) {
    console.log(`Usage: node .Systematize/scripts/node/lib/setup-hooks.mjs [--json] [--help]

OPTIONS:
  --json                Output JSON
  --help                Show help`);
    return;
  }

  const result = installPreCommitHook(repoRoot);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.status === 'installed') {
    console.log(`Installed pre-commit hook: ${result.target}`);
    return;
  }

  console.log('Skipped pre-commit hook installation because Git hooks are unavailable.');
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
