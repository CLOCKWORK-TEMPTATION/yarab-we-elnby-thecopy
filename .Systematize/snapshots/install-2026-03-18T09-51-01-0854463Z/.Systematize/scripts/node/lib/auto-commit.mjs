// Auto-commit — مكافئ auto-commit.ps1
import { execSync, execFileSync } from 'child_process';
import { getFeaturePathsEnv, hasGit, parseArgs } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit auto-commit [--command <name>] [--branch <name>] [--message <msg>] [--json]'); return; }

  if (!hasGit()) {
    if (opts.json) console.log(JSON.stringify({ committed: false, reason: 'No git' }));
    else console.log('⚠️ No git repository');
    return;
  }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const cmd = opts.command || 'update';
  const descMap = { systematize:'add PRD', clarify:'resolve ambiguities', plan:'add plan', tasks:'break into tasks', implement:'update progress' };
  const message = opts.message || `docs(specs): ${cmd} — ${descMap[cmd] || 'update documentation'} [${branch}]`;

  try {
    execFileSync('git', ['add', `specs/${branch}`, '.Systematize/memory/'], { cwd: env.REPO_ROOT, stdio: 'pipe' });
    const status = execSync('git diff --cached --name-only', { cwd: env.REPO_ROOT, encoding: 'utf8' }).trim();
    if (!status) {
      if (opts.json) console.log(JSON.stringify({ committed: false, reason: 'No changes' }));
      else console.log('ℹ️ No changes to commit');
      return;
    }
    execFileSync('git', ['commit', '-m', message], { cwd: env.REPO_ROOT, stdio: 'pipe' });
    if (opts.json) console.log(JSON.stringify({ committed: true, message, files: status.split('\n').length }));
    else console.log(`✅ Committed: ${message}`);
  } catch (e) {
    console.error(`❌ Commit failed: ${e.message}`);
    process.exit(1);
  }
}
