// إنشاء feature جديد — مكافئ create-new-feature.ps1
import { execFileSync, execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { getFeatureWorkspaceRoot, getRepoRoot, hasGit, parseArgs, getSyskitConfig, resolveTemplate } from './common.mjs';

const STOP_WORDS = new Set([
  'i', 'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
  'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their',
  'want', 'need', 'add', 'get', 'set'
]);

function cleanBranchName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}

function generateBranchName(description) {
  const cleanName = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanName.split(/\s+/).filter(Boolean);

  const meaningful = words.filter(w => {
    if (STOP_WORDS.has(w)) return false;
    if (w.length >= 3) return true;
    // Keep short words if uppercase in original (acronyms)
    return new RegExp(`\\b${w.toUpperCase()}\\b`).test(description);
  });

  if (meaningful.length > 0) {
    const maxWords = meaningful.length === 4 ? 4 : 3;
    return meaningful.slice(0, maxWords).join('-');
  }
  // Fallback
  return cleanBranchName(description).split('-').filter(Boolean).slice(0, 3).join('-');
}

function getHighestNumberFromFeatureWorkspace(featureWorkspaceDir) {
  let highest = 0;
  if (existsSync(featureWorkspaceDir)) {
    for (const d of readdirSync(featureWorkspaceDir)) {
      const m = d.match(/^(\d+)/);
      if (m) highest = Math.max(highest, parseInt(m[1]));
    }
  }
  return highest;
}

function getHighestNumberFromBranches() {
  let highest = 0;
  try {
    const branches = execSync('git branch -a', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    for (const line of branches.split('\n')) {
      const clean = line.trim().replace(/^\*?\s+/, '').replace(/^remotes\/[^/]+\//, '');
      const m = clean.match(/^(\d+)-/);
      if (m) highest = Math.max(highest, parseInt(m[1]));
    }
  } catch { /* ignore */ }
  return highest;
}

function getNextBranchNumber(featureWorkspaceDir) {
  // Fetch remotes
  try { execSync('git fetch --all --prune', { stdio: 'pipe' }); } catch { /* ignore */ }
  const highestBranch = getHighestNumberFromBranches();
  const highestWorkspace = getHighestNumberFromFeatureWorkspace(featureWorkspaceDir);
  return Math.max(highestBranch, highestWorkspace) + 1;
}

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help || opts._.length === 0) {
    console.log(`Usage: syskit create-feature <description> [OPTIONS]

OPTIONS:
  --short-name <name>   Custom branch suffix
  --number <N>          Override feature number (default: auto-detect)
  --preset <name>       Apply preset (web-fullstack, api-service, mobile-app, cli-tool, library)
  --json                Output JSON
  --help                Show help

EXAMPLES:
  node cli.mjs create-feature "Add user authentication" --short-name user-auth
  node cli.mjs create-feature "Implement OAuth2 integration" --preset api-service`);
    return;
  }

  const repoRoot = getRepoRoot();
  const description = opts._.join(' ').trim();
  if (!description) {
    console.error('Error: Feature description cannot be empty');
    process.exit(1);
  }

  const featureWorkspaceDir = getFeatureWorkspaceRoot(repoRoot, { mutating: true, ensureExists: true });

  // Generate branch name
  const branchSuffix = opts['short-name']
    ? cleanBranchName(opts['short-name'])
    : generateBranchName(description);

  // Determine branch number
  let number = opts.number ? parseInt(opts.number) : 0;
  if (number === 0) {
    number = hasGit()
      ? getNextBranchNumber(featureWorkspaceDir)
      : getHighestNumberFromFeatureWorkspace(featureWorkspaceDir) + 1;
  }

  const featureNum = String(number).padStart(3, '0');
  let branchName = `${featureNum}-${branchSuffix}`;

  // GitHub 244-byte limit
  if (branchName.length > 244) {
    const maxSuffix = 244 - 4;
    const truncated = branchSuffix.substring(0, maxSuffix).replace(/-$/, '');
    console.error(`[syskit] Branch name truncated from ${branchName.length} to fit 244-byte limit`);
    branchName = `${featureNum}-${truncated}`;
  }

  // Create git branch if available
  if (hasGit()) {
    try {
      execFileSync('git', ['checkout', '-q', '-b', branchName], { cwd: repoRoot, stdio: 'pipe' });
    } catch {
      // Check if branch exists
      try {
        const existing = execFileSync('git', ['branch', '--list', branchName], { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        if (existing) {
          console.error(`Error: Branch '${branchName}' already exists.`);
        } else {
          console.error(`Error: Failed to create git branch '${branchName}'.`);
        }
      } catch {
        console.error(`Error: Failed to create git branch '${branchName}'.`);
      }
      process.exit(1);
    }
  } else {
    if (!opts.json) console.error(`[syskit] Warning: Git not detected; skipped branch creation for ${branchName}`);
  }

  // Create feature directory and sys.md
  const featureDir = join(featureWorkspaceDir, branchName);
  mkdirSync(featureDir, { recursive: true });

  const templatePath = resolveTemplate(repoRoot, 'sys-template');
  const sysFile = join(featureDir, 'sys.md');
  if (templatePath) {
    copyFileSync(templatePath, sysFile);
  } else {
    writeFileSync(sysFile, '', 'utf8');
  }

  process.env.SYSTEMATIZE_FEATURE = branchName;

  // Handle preset
  const preset = opts.preset || (() => {
    const config = getSyskitConfig(repoRoot);
    return config && config.default_preset && config.default_preset !== 'null' ? config.default_preset : null;
  })();

  if (preset) {
    const registryFile = join(repoRoot, '.Systematize/presets/.registry');
    if (existsSync(registryFile)) {
      try {
        const registry = JSON.parse(readFileSync(registryFile, 'utf8'));
        if (registry.presets && registry.presets[preset]) {
          registry.active_preset = preset;
          writeFileSync(registryFile, JSON.stringify(registry, null, 2), 'utf8');
          if (!opts.json) console.log(`\u2705 Preset activated: ${preset}`);
        } else {
          const available = registry.presets ? Object.keys(registry.presets).join(', ') : 'none';
          console.error(`Preset '${preset}' not found. Available: ${available}`);
        }
      } catch (e) {
        console.error(`Could not update preset registry: ${e.message}`);
      }
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({
      BRANCH_NAME: branchName,
      SYS_FILE: sysFile,
      FEATURE_NUM: featureNum,
      HAS_GIT: hasGit(),
    }));
  } else {
    console.log(`BRANCH_NAME: ${branchName}`);
    console.log(`SYS_FILE: ${sysFile}`);
    console.log(`FEATURE_NUM: ${featureNum}`);
    console.log(`HAS_GIT: ${hasGit()}`);
    console.log(`SYSTEMATIZE_FEATURE environment variable set to: ${branchName}`);
    console.log(`\u2705 Feature created successfully`);
  }
}
