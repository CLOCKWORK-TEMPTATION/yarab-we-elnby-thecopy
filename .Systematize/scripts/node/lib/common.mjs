// Systematize Framework — دوال مشتركة (مكافئ common.ps1)
import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { readFlatYamlFile } from './config-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const FEATURE_WORKSPACE_DIR = 'features';
export const LEGACY_FEATURE_WORKSPACE_DIRS = [
  'aminooof',
  Buffer.from('c3BlY3M=', 'base64').toString('utf8')
];

function hasNumberedFeatureDirs(rootDir) {
  if (!existsSync(rootDir)) return false;

  return readdirSync(rootDir).some((entry) => {
    const entryPath = join(rootDir, entry);
    return /^\d{3}-/.test(entry) && statSync(entryPath).isDirectory();
  });
}

function moveFeatureWorkspace(sourceDir, targetDir) {
  try {
    renameSync(sourceDir, targetDir);
    return;
  } catch (error) {
    if (!error || error.code !== 'EXDEV') throw error;
  }

  cpSync(sourceDir, targetDir, { recursive: true });
  rmSync(sourceDir, { recursive: true, force: true });
}

export function getFeatureWorkspaceRoot(repoRoot = getRepoRoot(), options = {}) {
  const nextRoot = join(repoRoot, FEATURE_WORKSPACE_DIR);
  const nextExists = existsSync(nextRoot);
  const existingLegacyRoots = LEGACY_FEATURE_WORKSPACE_DIRS
    .map((name) => join(repoRoot, name))
    .filter((candidate) => existsSync(candidate));
  const mutating = options.mutating === true;
  const ensureExists = options.ensureExists === true;

  if ((nextExists && existingLegacyRoots.length > 0) || existingLegacyRoots.length > 1) {
    const conflictingRoots = [nextRoot, ...existingLegacyRoots].filter((item, index, array) => array.indexOf(item) === index);
    throw new Error(
      `Conflicting workflow roots detected. Resolve manually before continuing:\n- ${conflictingRoots.join('\n- ')}`
    );
  }

  if (existingLegacyRoots.length === 1 && !nextExists) {
    const [legacyRoot] = existingLegacyRoots;
    if (mutating) {
      moveFeatureWorkspace(legacyRoot, nextRoot);
      return nextRoot;
    }

    return legacyRoot;
  }

  if (!nextExists && ensureExists) {
    mkdirSync(nextRoot, { recursive: true });
  }

  return nextRoot;
}

export function getConstitutionFilePath(repoRoot = getRepoRoot()) {
  return join(repoRoot, '.Systematize', 'memory', 'constitution.md');
}

function extractClarificationSection(sysContent) {
  const startIndex = sysContent.indexOf('## Clarification Contract');
  if (startIndex === -1) return '';

  const rest = sysContent.slice(startIndex);
  const nextSectionMatch = rest.match(/\n---\s*\n\s*## Level 3:|\n## Level 3:/);
  if (!nextSectionMatch) return rest;

  return rest.slice(0, nextSectionMatch.index);
}

// === دوال أساسية ===

export function getRepoRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
    return result;
  } catch {
    // Fallback 1: ابحث عن .Systematize أو .git من مسار التنفيذ الحالي
    let current = resolve(process.cwd());
    while (current !== dirname(current)) {
      if (existsSync(join(current, '.Systematize')) || existsSync(join(current, '.git'))) {
        return current;
      }
      current = dirname(current);
    }

    // Fallback 2: ابحث عن .Systematize من مسار السكريبت
    current = resolve(__dirname, '../../..');
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
    // Fallback: آخر feature من مجلد features/
    try {
      const featureRoot = getFeatureWorkspaceRoot(getRepoRoot());
      if (existsSync(featureRoot)) {
        const dirs = readdirSync(featureRoot).filter(d => /^\d{3}-/.test(d)).sort();
        if (dirs.length > 0) return dirs[dirs.length - 1];
      }
    } catch {
      // Ignore workspace conflicts while resolving a best-effort branch name.
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

export function getFeatureDir(repoRoot, branch, options = {}) {
  return join(getFeatureWorkspaceRoot(repoRoot, options), branch);
}

export function getFeaturePathsEnv(options = {}) {
  const repoRoot = getRepoRoot();
  const branch = getCurrentBranch();
  const featureRoot = getFeatureWorkspaceRoot(repoRoot, options);
  const featureDir = join(featureRoot, branch);
  return {
    REPO_ROOT: repoRoot,
    CURRENT_BRANCH: branch,
    HAS_GIT: hasGit(),
    FEATURE_ROOT: featureRoot,
    FEATURES_DIR: featureDir,
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

export function getAllFeatureDirs(repoRoot, options = {}) {
  const featureRoot = getFeatureWorkspaceRoot(repoRoot || getRepoRoot(), options);
  if (!existsSync(featureRoot)) return [];
  return readdirSync(featureRoot)
    .filter(d => /^\d{3}-/.test(d) && statSync(join(featureRoot, d)).isDirectory())
    .sort()
    .map(d => ({ name: d, path: join(featureRoot, d) }));
}

export function getDocumentCompletionStatus(filePath, options = {}) {
  if (!existsSync(filePath)) {
    return { status: 'not_started', file_exists: false, placeholders: 0, missing_markers: [] };
  }

  const content = readFileSync(filePath, 'utf8');
  const placeholders = findUnresolvedPlaceholders(content);
  const missingMarkers = (options.requiredMarkers || []).filter((marker) => !content.includes(marker));
  const isBlank = content.trim().length === 0;

  if (isBlank) {
    return { status: 'not_started', file_exists: true, placeholders: placeholders.length, missing_markers: missingMarkers };
  }

  return {
    status: placeholders.length === 0 && missingMarkers.length === 0 ? 'complete' : 'partial',
    file_exists: true,
    placeholders: placeholders.length,
    missing_markers: missingMarkers
  };
}

export function getClarificationStatus(featureDir) {
  const sysFile = join(featureDir, 'sys.md');
  if (!existsSync(sysFile)) {
    return { status: 'not_started', file_exists: false, questions_resolved: 0, assumptions_documented: 0 };
  }

  const section = extractClarificationSection(readFileSync(sysFile, 'utf8'));
  if (!section) {
    return { status: 'not_started', file_exists: true, questions_resolved: 0, assumptions_documented: 0 };
  }

  const unresolvedPlaceholders = findUnresolvedPlaceholders(section);
  const questionsResolved = section
    .split('\n')
    .filter((line) => line.trim().startsWith('- Q:') && !/\[question\]|\[answer\]|\[section\/decision affected\]/.test(line))
    .length;
  const assumptionsDocumented = section
    .split('\n')
    .filter((line) => /\*\*ASM-\d{3}\*\*/.test(line) && !/\[Assumption\]|\[why assumed\]|\[impact\]/.test(line))
    .length;
  const checklistNeedsSelection = section.includes('☐ Yes / ☐ No');
  const checklistHasNo = /\|\s*\d+\s*\|[^|]+\|\s*☐ No\s*\|/.test(section);
  const hasWork = questionsResolved > 0 || assumptionsDocumented > 0;

  return {
    status: hasWork && unresolvedPlaceholders.length === 0 && !checklistNeedsSelection && !checklistHasNo ? 'complete' : 'partial',
    file_exists: true,
    questions_resolved: questionsResolved,
    assumptions_documented: assumptionsDocumented
  };
}

export function getConstitutionStatus(repoRoot = getRepoRoot()) {
  return getDocumentCompletionStatus(getConstitutionFilePath(repoRoot), {
    requiredMarkers: ['## ٢٧. تقييم الاكتمال']
  });
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
  const totalPhases = 8;
  let completed = 0;
  if (existsSync(join(featureDir, 'sys.md'))) completed++;
  if (getClarificationStatus(featureDir).status === 'complete') completed++;
  if (getConstitutionStatus(dirname(dirname(featureDir))).status === 'complete') completed++;
  if (getDocumentCompletionStatus(join(featureDir, 'research.md')).status === 'complete') completed++;
  if (getDocumentCompletionStatus(join(featureDir, 'plan.md')).status === 'complete') completed++;
  if (getDocumentCompletionStatus(join(featureDir, 'tasks.md')).status !== 'not_started') completed++;
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
  return readFlatYamlFile(configPath);
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

export function getPresetRegistry(repoRoot = getRepoRoot()) {
  const registryPath = join(repoRoot, '.Systematize', 'presets', '.registry');
  if (!existsSync(registryPath)) return null;

  try {
    return JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch {
    return null;
  }
}

export function getActivePresetName(repoRoot = getRepoRoot(), preferredPreset = null) {
  if (preferredPreset && preferredPreset !== 'null') return preferredPreset;

  const registry = getPresetRegistry(repoRoot);
  if (registry?.active_preset) return registry.active_preset;

  const config = getSyskitConfig(repoRoot);
  if (config?.default_preset && config.default_preset !== 'null') {
    return config.default_preset;
  }

  return null;
}

export function resolveCoreTemplate(repoRoot, templateName) {
  const basePath = join(repoRoot, '.Systematize', 'templates');
  const overridePath = join(basePath, 'overrides', `${templateName}.md`);
  if (existsSync(overridePath)) return overridePath;

  const corePath = join(basePath, `${templateName}.md`);
  if (existsSync(corePath)) return corePath;

  const extDir = join(repoRoot, '.Systematize', 'extensions');
  if (existsSync(extDir)) {
    const exts = readdirSync(extDir).filter(d => !d.startsWith('.')).sort();
    for (const ext of exts) {
      const candidate = join(extDir, ext, 'templates', `${templateName}.md`);
      if (existsSync(candidate)) return candidate;
    }
  }

  return null;
}

export function resolveActivePresetTemplate(repoRoot, templateName, options = {}) {
  const presetName = getActivePresetName(repoRoot, options.preset || null);
  if (!presetName) return null;

  const candidate = join(repoRoot, '.Systematize', 'presets', presetName, 'templates', `${templateName}.md`);
  return existsSync(candidate) ? candidate : null;
}

export function composeTemplateWithActivePreset(repoRoot, templateName, options = {}) {
  const baseTemplate = resolveCoreTemplate(repoRoot, templateName);
  const presetTemplate = resolveActivePresetTemplate(repoRoot, templateName, options);

  if (!baseTemplate && !presetTemplate) return null;

  const layers = [];
  let content = '';

  if (baseTemplate) {
    content = readFileSync(baseTemplate, 'utf8').trimEnd();
    layers.push(baseTemplate);
  }

  if (presetTemplate && presetTemplate !== baseTemplate) {
    const overlay = readFileSync(presetTemplate, 'utf8').trim();
    if (overlay) {
      content = content ? `${content}\n\n---\n\n${overlay}` : overlay;
      layers.push(presetTemplate);
    }
  }

  return {
    content: `${content}\n`,
    layers,
    base_template: baseTemplate,
    preset_template: presetTemplate,
    preset_name: presetTemplate ? getActivePresetName(repoRoot, options.preset || null) : null
  };
}

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
