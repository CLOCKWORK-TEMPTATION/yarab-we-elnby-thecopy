// توليد PR — مكافئ generate-pr.ps1
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getFeaturePathsEnv, getFeatureDir, getFeatureProgress, parseArgs, ensureDir } from './common.mjs';
import { evaluateFeatureHealth } from './health.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit generate-pr [--branch <name>] [--base <branch>] [--json]'); return; }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;

  if (!existsSync(featureDir)) { console.error(`❌ Not found: ${featureDir}`); process.exit(1); }

  const progress = getFeatureProgress(featureDir);
  const artifacts = ['sys.md','plan.md','tasks.md','research.md'].map(f => {
    const exists = existsSync(join(featureDir, f));
    return `- [${exists ? 'x' : ' '}] ${f}`;
  }).join('\n');

  // Extract feature name and description from sys.md
  const sysFile = join(featureDir, 'sys.md');
  let featureName = branch;
  let featureDescription = '';
  if (existsSync(sysFile)) {
    const sysContent = readFileSync(sysFile, 'utf8');
    const nameMatch = sysContent.match(/^#+\s+(.+?)$/m);
    if (nameMatch) featureName = nameMatch[1];
    const descMatch = sysContent.match(/##\s+Overview\s*\n([\s\S]*?)(?=\n##|$)/);
    if (descMatch) featureDescription = descMatch[1].split('\n').slice(0, 3).join('\n').trim();
  }

  const health = evaluateFeatureHealth(featureDir);

  const body = `## Feature: ${featureName}\n\n${featureDescription ? `**Description:** ${featureDescription}\n\n` : ''}### Artifacts\n${artifacts}\n\n### Quality\n- Progress: ${progress.percent}%\n- Health Score: ${health.score}/${health.maxScore}\n- Health Status: ${health.status}\n\n### Checklist\n- [ ] All artifacts reviewed\n- [ ] Health score ≥ 70\n- [ ] Tests passing`;

  const exportsDir = join(env.REPO_ROOT, '.Systematize/exports');
  ensureDir(exportsDir);
  const prFile = join(exportsDir, `${branch}-pr.md`);
  writeFileSync(prFile, body, 'utf8');

  if (opts.json) console.log(JSON.stringify({ branch, featureName, bodyFile: prFile, progress: progress.percent, healthScore: health.score, healthStatus: health.status }));
  else console.log(`✅ PR template: ${prFile}`);
}
