// تحديث حالة المزامنة — مكافئ update-sync-state.ps1
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getFeaturePathsEnv, getFeatureDir, getArtifactHash, parseArgs, readJsonFile, writeJsonFile } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit update-sync-state [--branch <name>] [--json]'); return; }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;

  if (!existsSync(featureDir)) { console.error(`❌ Not found: ${featureDir}`); process.exit(1); }

  const syncPath = join(env.REPO_ROOT, '.Systematize/memory/sync-state.json');
  const existingState = readJsonFile(syncPath) || {};
  const syncState = {
    schema_version: 1,
    features: existingState.features || {},
    extensions: existingState.extensions || {},
    last_global_check: existingState.last_global_check || null
  };

  const hashes = {};
  const files = readdirSync(featureDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    hashes[file] = getArtifactHash(join(featureDir, file));
  }

  const sys = existsSync(join(featureDir, 'sys.md')) ? readFileSync(join(featureDir, 'sys.md'), 'utf8') : '';
  const frCount = (sys.match(/FR-\d{3}/g) || []).length;

  syncState.features[branch] = { last_sync: new Date().toISOString(), hashes, baseline_fr_count: frCount };
  syncState.last_global_check = new Date().toISOString();
  writeJsonFile(syncPath, syncState);

  if (opts.json) console.log(JSON.stringify({ branch, hashes, frCount, updated: true }, null, 2));
  else console.log(`✅ Sync state updated for ${branch} (${Object.keys(hashes).length} files, ${frCount} FRs)`);
}
