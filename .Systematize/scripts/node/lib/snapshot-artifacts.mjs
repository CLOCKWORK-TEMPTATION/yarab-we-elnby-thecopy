// حفظ نسخة احتياطية — مكافئ snapshot-artifacts.ps1
import { existsSync, readdirSync, copyFileSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';
import { getFeaturePathsEnv, getFeatureDir, getArtifactHash, parseArgs, ensureDir, readJsonFile, writeJsonFile } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('Usage: syskit snapshot [--branch <name>] [--tag <label>] [--json]'); return; }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;

  if (!existsSync(featureDir)) { console.error(`❌ Feature directory not found: ${featureDir}`); process.exit(1); }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15).replace('T', '_');
  let snapshotDir = join(env.REPO_ROOT, `.Systematize/snapshots/${branch}/${timestamp}`);
  if (opts.tag) snapshotDir += `_${opts.tag}`;
  ensureDir(snapshotDir);

  // نسخ ملفات .md
  const manifest = {};
  const files = readdirSync(featureDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const src = join(featureDir, file);
    copyFileSync(src, join(snapshotDir, file));
    manifest[file] = getArtifactHash(src);
  }

  // نسخ مجلدات فرعية
  for (const sub of ['contracts', 'checklists']) {
    const subPath = join(featureDir, sub);
    if (existsSync(subPath)) {
      cpSync(subPath, join(snapshotDir, sub), { recursive: true });
    }
  }

  // حفظ manifest
  writeJsonFile(join(snapshotDir, 'manifest.json'), { branch, timestamp, tag: opts.tag || null, files: manifest });

  // تحديث sync-state
  const syncPath = join(env.REPO_ROOT, '.Systematize/memory/sync-state.json');
  const existingState = readJsonFile(syncPath) || {};
  const syncState = {
    schema_version: 1,
    features: existingState.features || {},
    extensions: existingState.extensions || {},
    last_global_check: existingState.last_global_check || null
  };
  syncState.features[branch] = { last_snapshot: timestamp, hashes: manifest };
  writeJsonFile(syncPath, syncState);

  if (opts.json) {
    console.log(JSON.stringify({ branch, snapshot: snapshotDir, files: Object.keys(manifest).length }));
  } else {
    console.log(`✅ Snapshot created: ${snapshotDir}`);
    console.log(`   Files: ${Object.keys(manifest).length}`);
  }
}
