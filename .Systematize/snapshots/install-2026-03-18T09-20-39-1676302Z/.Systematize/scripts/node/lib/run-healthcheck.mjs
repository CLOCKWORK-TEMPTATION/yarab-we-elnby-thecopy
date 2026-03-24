// فحص صحة الوثائق — مكافئ run-healthcheck.ps1
import { existsSync } from 'fs';
import { getFeaturePathsEnv, getFeatureDir, parseArgs } from './common.mjs';
import { evaluateFeatureHealth } from './health.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit healthcheck [--branch <name>] [--threshold <n>] [--json]'); return; }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;
  const threshold = parseInt(opts.threshold || '70', 10);

  if (!existsSync(featureDir)) { console.error(`❌ Feature not found: ${featureDir}`); process.exit(1); }
  const health = evaluateFeatureHealth(featureDir, threshold);

  if (opts.json) {
    console.log(JSON.stringify({ branch, ...health }, null, 2));
  } else {
    console.log(`\n🏥 Health Score: ${health.score}/${health.maxScore}\n`);
    for (const c of health.checks) {
      const icon = c.score === 10 ? '✅' : c.score >= 5 ? '⚠️' : '❌';
      console.log(`  ${icon} ${c.name}: ${c.score}/${c.maxScore}`);
      for (const issue of c.issues) console.log(`     └── ${issue}`);
    }
    console.log(`\nStatus: ${health.status} ${health.status === 'HEALTHY' ? '✅' : '❌'} (threshold: ${threshold})`);
  }

  if (health.score < threshold) process.exit(1);
}
