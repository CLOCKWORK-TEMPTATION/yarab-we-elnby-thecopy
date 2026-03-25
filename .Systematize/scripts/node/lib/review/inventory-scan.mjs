import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function detectPackageManager(repoRoot, packageJson) {
  const packageManagerField = packageJson?.packageManager || '';
  if (packageManagerField.startsWith('pnpm')) return 'pnpm';
  if (packageManagerField.startsWith('npm')) return 'npm';
  if (packageManagerField.startsWith('yarn')) return 'yarn';
  if (packageManagerField.startsWith('bun')) return 'bun';
  if (existsSync(join(repoRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(repoRoot, 'package-lock.json'))) return 'npm';
  if (existsSync(join(repoRoot, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(repoRoot, 'bun.lockb'))) return 'bun';
  return 'unknown';
}

function detectRootDirectories(repoRoot) {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function detectLayers(rootEntries) {
  const layers = new Set();

  if (rootEntries.some((entry) => ['app', 'frontend', 'pages', 'components'].includes(entry))) {
    layers.add('frontend');
  }

  if (rootEntries.some((entry) => ['backend', 'server', 'api'].includes(entry))) {
    layers.add('server');
  }

  if (rootEntries.some((entry) => ['src', 'packages', 'lib', 'shared'].includes(entry))) {
    layers.add('shared');
  }

  return [...layers];
}

function detectGovernanceFiles(repoRoot) {
  return {
    package_json: existsSync(join(repoRoot, 'package.json')),
    tsconfig: existsSync(join(repoRoot, 'tsconfig.json')),
    eslint_config: existsSync(join(repoRoot, 'eslint.config.js'))
      || existsSync(join(repoRoot, 'eslint.config.mjs'))
      || existsSync(join(repoRoot, '.eslintrc'))
      || existsSync(join(repoRoot, '.eslintrc.js'))
      || existsSync(join(repoRoot, '.eslintrc.cjs'))
      || existsSync(join(repoRoot, '.eslintrc.json')),
    next_config: existsSync(join(repoRoot, 'next.config.js'))
      || existsSync(join(repoRoot, 'next.config.mjs'))
      || existsSync(join(repoRoot, 'next.config.ts')),
    tests_dir: existsSync(join(repoRoot, 'tests'))
      || existsSync(join(repoRoot, '__tests__'))
      || existsSync(join(repoRoot, 'test'))
  };
}

function detectOperationalConstraints(packageManager, packageJson, rootEntries) {
  const constraints = [];

  if (packageManager === 'unknown') {
    constraints.push('Package manager could not be determined from package.json or lockfiles.');
  }

  if (!packageJson) {
    constraints.push('package.json is missing at the repository root.');
  }

  if (rootEntries.includes('.env.local')) {
    constraints.push('Repository root contains .env.local assumptions that may not hold in CI or production.');
  }

  return constraints;
}

export function scanRepositoryInventory(repoRoot) {
  const packageJsonPath = join(repoRoot, 'package.json');
  const packageJson = existsSync(packageJsonPath) ? safeReadJson(packageJsonPath) : null;
  const rootEntries = detectRootDirectories(repoRoot);
  const governanceFiles = detectGovernanceFiles(repoRoot);
  const detectedLayers = detectLayers(rootEntries);
  const packageManager = detectPackageManager(repoRoot, packageJson);

  return {
    repo_root: repoRoot,
    package_manager: packageManager,
    detected_layers: detectedLayers,
    root_directories: rootEntries,
    governance_files: governanceFiles,
    scripts: packageJson?.scripts || {},
    constraints: detectOperationalConstraints(packageManager, packageJson, rootEntries)
  };
}
