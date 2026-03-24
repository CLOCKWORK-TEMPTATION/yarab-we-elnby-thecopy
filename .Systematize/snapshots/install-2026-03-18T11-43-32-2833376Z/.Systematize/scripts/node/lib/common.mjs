// Systematize KIT — دوال مشتركة (مكافئ common.ps1)
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === دوال أساسية ===

export function getRepoRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
    return result;
  } catch {
    // Fallback: ابحث عن .Systematize من مسار السكريبت
    let current = resolve(__dirname, '../../..');
    while (current !== dirname(current)) {
      if (existsSync(join(current, '.Systematize')) || existsSync(join(current, '.git'))) {
        return current;
      }
      current = dirname(current);
    }
    return resolve(__dirname, '../../..');
  }
}

export function getCurrentBranch() {
  if (process.env.SYSTEMATIZE_FEATURE) return process.env.SYSTEMATIZE_FEATURE;
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
  } catch {
    // Fallback: آخر feature من specs/
    const specsDir = join(getRepoRoot(), 'specs');
    if (existsSync(specsDir)) {
      const dirs = readdirSync(specsDir).filter(d => /^\d{3}-/.test(d)).sort();
      if (dirs.length > 0) return dirs[dirs.length - 1];
    }
    return 'main';
  }
}

export function hasGit() {
  try {
    execSync('git rev-parse --show-toplevel', { stdio: ['pipe','pipe','pipe'] });
    return true;
  } catch { return false; }
}

export function getFeatureDir(repoRoot, branch) {
  return join(repoRoot, 'specs', branch);
}

export function getFeaturePathsEnv() {
  const repoRoot = getRepoRoot();
  const branch = getCurrentBranch();
  const featureDir = getFeatureDir(repoRoot, branch);
  return {
    REPO_ROOT: repoRoot,
    CURRENT_BRANCH: branch,
    HAS_GIT: hasGit(),
    FEATURE_DIR: featureDir,
    FEATURE_SYS: join(featureDir, 'sys.md'),
    IMPL_PLAN: join(featureDir, 'plan.md'),
    TASKS: join(featureDir, 'tasks.md'),
    RESEARCH: join(featureDir, 'research.md'),
    AGENTS_MD: join(featureDir, 'AGENTS.md'),
    QUICKSTART: join(featureDir, 'quickstart.md'),
    CONTRACTS_DIR: join(featureDir, 'contracts'),
  };
}

// === دوال v2 ===

export function getAllFeatureDirs(repoRoot) {
  const specsDir = join(repoRoot || getRepoRoot(), 'specs');
  if (!existsSync(specsDir)) return [];
  return readdirSync(specsDir)
    .filter(d => /^\d{3}-/.test(d) && statSync(join(specsDir, d)).isDirectory())
    .sort()
    .map(d => ({ name: d, path: join(specsDir, d) }));
}

export function getArtifactHash(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex').toUpperCase();
}

export function getTrackedIDs(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf8');
  const pattern = /(?:FR|NFR|BR|AC|RK|ASM|TC|INT|ADR|OBJ|KPI|RQ|BE-T|FE-T|DO-T|CC-T|CHK)-\d{3}/g;
  const matches = content.match(pattern) || [];
  return [...new Set(matches)].sort();
}

export function getFeatureProgress(featureDir) {
  const totalPhases = 6;
  let completed = 0;
  if (existsSync(join(featureDir, 'sys.md'))) completed++;
  if (existsSync(join(featureDir, 'research.md'))) completed++;
  if (existsSync(join(featureDir, 'plan.md'))) completed++;
  if (existsSync(join(featureDir, 'tasks.md'))) completed++;
  const checkDir = join(featureDir, 'checklists');
  if (existsSync(checkDir) && readdirSync(checkDir).length > 0) completed++;
  const tasksFile = join(featureDir, 'tasks.md');
  if (existsSync(tasksFile)) {
    const tc = readFileSync(tasksFile, 'utf8');
    if (/\[X\]|\[x\]/.test(tc)) completed++;
  }
  return { completed, total: totalPhases, percent: Math.round((completed / totalPhases) * 100) };
}

export function getSyskitConfig(repoRoot) {
  const configPath = join(repoRoot || getRepoRoot(), '.Systematize/config/syskit-config.yml');
  if (!existsSync(configPath)) return null;
  const content = readFileSync(configPath, 'utf8');
  const config = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      let [, key, val] = match;
      key = key.trim();
      val = val.trim().replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^\d+$/.test(val)) val = parseInt(val, 10);
      config[key] = val;
    }
  }
  return config;
}

export function readFileOrEmpty(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}

export function writeJsonFile(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function readJsonFile(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// === تحليل المعاملات ===

export function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') opts.json = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--draft') opts.draft = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { opts[key] = next; i++; }
      else opts[key] = true;
    }
    else opts._.push(arg);
  }
  return opts;
}

// === جديد — 5 دوال إضافية (المرحلة 2.0) ===

export function resolveTemplate(repoRoot, templateName) {
  // Priority Stack:
  // 1. templates/overrides/ ← تخصيصات المستخدم
  // 2. presets/*/templates/ ← حسب priority في .registry
  // 3. extensions/*/templates/ ← توسعات إضافية
  // 4. templates/ ← القوالب الأساسية

  const basePath = join(repoRoot, '.Systematize/templates');

  // Priority 1: Overrides
  const overridePath = join(basePath, 'overrides', `${templateName}.md`);
  if (existsSync(overridePath)) return overridePath;

  // Priority 2: Presets (ordered by .registry priority)
  const presetsDir = join(repoRoot, '.Systematize/presets');
  if (existsSync(presetsDir)) {
    const registryPath = join(presetsDir, '.registry');
    let sortedPresets = [];

    if (existsSync(registryPath)) {
      try {
        const registryData = JSON.parse(readFileSync(registryPath, 'utf8'));
        if (registryData.presets) {
          sortedPresets = Object.entries(registryData.presets)
            .sort(([, a], [, b]) => (a.priority || 10) - (b.priority || 10))
            .map(([name]) => name);
        }
      } catch {
        // Fallback to alphabetical
      }
    }

    if (sortedPresets.length === 0) {
      sortedPresets = readdirSync(presetsDir).filter(d => !d.startsWith('.'));
    }

    for (const preset of sortedPresets) {
      const candidate = join(presetsDir, preset, 'templates', `${templateName}.md`);
      if (existsSync(candidate)) return candidate;
    }
  }

  // Priority 3: Extensions
  const extDir = join(repoRoot, '.Systematize/extensions');
  if (existsSync(extDir)) {
    const exts = readdirSync(extDir).filter(d => !d.startsWith('.')).sort();
    for (const ext of exts) {
      const candidate = join(extDir, ext, 'templates', `${templateName}.md`);
      if (existsSync(candidate)) return candidate;
    }
  }

  // Priority 4: Core templates
  const corePath = join(basePath, `${templateName}.md`);
  if (existsSync(corePath)) return corePath;

  return null;
}

export function testFeatureBranch(branch) {
  // Validate feature branch naming: must start with NNN- (3 digits)
  return /^\d{3}-/.test(branch);
}

export function compareTrackedIDs(oldIDs, newIDs) {
  // Compare two arrays of IDs and return added/removed/unchanged
  const oldSet = new Set(oldIDs);
  const newSet = new Set(newIDs);
  const added = Array.from(newSet).filter(id => !oldSet.has(id));
  const removed = Array.from(oldSet).filter(id => !newSet.has(id));
  const kept = Array.from(newSet).filter(id => oldSet.has(id));
  return { added, removed, kept };
}

export function exportChangelogEntry(filePath, entry) {
  const timestamp = entry?.date || new Date().toISOString().split('T')[0];
  const change = entry?.description || entry?.change || entry?.title || 'Documentation updated';
  const author = entry?.author || 'system';
  const version = entry?.version || '—';
  const row = `| ${timestamp} | ${version} | ${change} | ${author} |`;

  if (!existsSync(filePath)) {
    ensureDir(dirname(filePath));
    writeFileSync(
      filePath,
      `## Changelog\n\n| Date | Version | Change | Author |\n|------|---------|--------|--------|\n${row}\n`,
      'utf8'
    );
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  if (!content.includes('## Changelog')) {
    writeFileSync(
      filePath,
      `${content.replace(/\s*$/, '')}\n\n## Changelog\n\n| Date | Version | Change | Author |\n|------|---------|--------|--------|\n${row}\n`,
      'utf8'
    );
    return;
  }

  const lines = content.split('\n');
  let insertAt = -1;
  let inChangelog = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^## Changelog/.test(line)) {
      inChangelog = true;
      continue;
    }

    if (inChangelog && /^## /.test(line)) {
      insertAt = index;
      break;
    }

    if (inChangelog && /^\|/.test(line)) {
      insertAt = index + 1;
    }
  }

  if (insertAt === -1) insertAt = lines.length;
  lines.splice(insertAt, 0, row);
  writeFileSync(filePath, `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`, 'utf8');
}

export function getFeatureOwner(featureDir) {
  // Extract owner/lead from sys.md file (first ## Owner or Lead section)
  const sysPath = join(featureDir, 'sys.md');
  if (!existsSync(sysPath)) return null;

  const content = readFileSync(sysPath, 'utf8');
  // Look for patterns like "Owner: name" or "## Owner: name"
  const ownerMatch = content.match(/(?:##\s+Owner|Owner)\s*:\s*([^\n]+)/i);
  if (ownerMatch) return ownerMatch[1].trim();

  // Fallback: look for Lead
  const leadMatch = content.match(/(?:##\s+Lead|Lead)\s*:\s*([^\n]+)/i);
  if (leadMatch) return leadMatch[1].trim();

  return null;
}

export function findUnresolvedPlaceholders(content) {
  return [...new Set((content.match(/\[[A-Z_]{3,}(?::[^\]]+)?\]/g) || []))];
}
