import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadText(filePath) {
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf8');
}

const FRONTEND_CD_PATTERN = /cd\s+frontend\b/i;
const FRONTEND_PATH_PATTERN = /frontend\//i;

function detectPackageManagerCommand(packageJson = {}) {
  const packageManager = String(packageJson.packageManager || '').toLowerCase();
  if (packageManager.startsWith('yarn')) return 'yarn';
  if (packageManager.startsWith('bun')) return 'bun';
  if (packageManager.startsWith('npm')) return 'npm';
  return 'pnpm';
}

function buildCommandPattern(packageManagerCommand, scriptName) {
  return new RegExp(`${packageManagerCommand}\\s+${scriptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

export function auditDocumentationDrift(repoRoot) {
  const evidence = [];
  const findings = [];

  const rootPackageJson = safeReadJson(join(repoRoot, 'package.json')) || {};
  const webPackageJson = safeReadJson(join(repoRoot, 'apps', 'web', 'package.json')) || {};
  const backendPackageJson = safeReadJson(join(repoRoot, 'apps', 'backend', 'package.json')) || {};
  const rootReadmePath = join(repoRoot, 'README.md');
  const webReadmePath = join(repoRoot, 'apps', 'web', 'README.md');

  const rootReadme = loadText(rootReadmePath);
  const webReadme = loadText(webReadmePath);
  const rootCommand = detectPackageManagerCommand(rootPackageJson);
  const webCommand = detectPackageManagerCommand(webPackageJson);
  const startDevPattern = buildCommandPattern(rootCommand, 'start:dev');
  const killDevPattern = buildCommandPattern(rootCommand, 'kill:dev');
  const typecheckPattern = buildCommandPattern(webCommand, 'typecheck');

  if (rootReadme) {
    evidence.push(createEvidenceRecord({
      id: 'EV-DD-001',
      source_type: 'file',
      location: rootReadmePath,
      result: 'success',
      summary: 'Loaded root README for documentation drift checks.'
    }));

    if (startDevPattern.test(rootReadme) && !rootPackageJson.scripts?.['start:dev']) {
      findings.push(createFinding({
        id: 'FD-DD-001',
        type: 'documentation_drift',
        severity: 'medium',
        layer: 'documentation_drift',
        location: rootReadmePath,
        problem: 'Root README documents pnpm start:dev even though the root manifest does not expose that script.',
        evidence: 'README.md quick-start section references pnpm start:dev, while package.json exposes dev/start/stop but no start:dev.',
        impact: 'Reviewers and developers may follow a non-existent startup path and mis-diagnose workspace failures.',
        fix: 'Update the README to use the real root script names from package.json.'
      }));
    }

    if (killDevPattern.test(rootReadme) && !rootPackageJson.scripts?.['kill:dev']) {
      findings.push(createFinding({
        id: 'FD-DD-002',
        type: 'documentation_drift',
        severity: 'medium',
        layer: 'documentation_drift',
        location: rootReadmePath,
        problem: 'Root README documents pnpm kill:dev even though the root manifest uses a different stop command.',
        evidence: 'README.md quick-start section references pnpm kill:dev, while package.json exposes stop instead.',
        impact: 'Operators may leave background services running because the documented shutdown command does not exist.',
        fix: 'Replace pnpm kill:dev in the README with the actual root shutdown command.'
      }));
    }

    if (FRONTEND_CD_PATTERN.test(rootReadme) && existsSync(join(repoRoot, 'apps', 'web'))) {
      findings.push(createFinding({
        id: 'FD-DD-003',
        type: 'documentation_drift',
        severity: 'medium',
        layer: 'documentation_drift',
        location: rootReadmePath,
        problem: 'Root README still documents a frontend directory even though the workspace app lives under apps/web.',
        evidence: 'README.md development commands use cd frontend, while the actual workspace manifest is apps/web/package.json.',
        impact: 'Contributors can start from the wrong directory and conclude the frontend workflow is broken.',
        fix: 'Update the README examples to use apps/web or root-level workspace commands.'
      }));
    }
  }

  if (webReadme) {
    evidence.push(createEvidenceRecord({
      id: 'EV-DD-002',
      source_type: 'file',
      location: webReadmePath,
      result: 'success',
      summary: 'Loaded apps/web README for command drift checks.'
    }));

    if (FRONTEND_PATH_PATTERN.test(webReadme) && !existsSync(join(repoRoot, 'frontend'))) {
      findings.push(createFinding({
        id: 'FD-DD-004',
        type: 'documentation_drift',
        severity: 'low',
        layer: 'documentation_drift',
        location: webReadmePath,
        problem: 'apps/web README still describes the frontend as frontend/ instead of apps/web.',
        evidence: 'apps/web/README.md describes the application as frontend/ even though the checked-in path is apps/web/.',
        impact: 'Path-sensitive commands and architectural references drift away from the actual workspace layout.',
        fix: 'Rename the documented app path to apps/web throughout the README.'
      }));
    }

    if (typecheckPattern.test(webReadme) && !webPackageJson.scripts?.typecheck && webPackageJson.scripts?.['type-check']) {
      findings.push(createFinding({
        id: 'FD-DD-005',
        type: 'documentation_drift',
        severity: 'low',
        layer: 'documentation_drift',
        location: webReadmePath,
        problem: 'apps/web README documents pnpm typecheck while the app manifest exposes pnpm type-check.',
        evidence: 'apps/web/README.md uses the old script name typecheck, but apps/web/package.json defines type-check.',
        impact: 'The documented frontend validation path fails even when the app scripts are otherwise healthy.',
        fix: 'Update the README to use the exact script name from apps/web/package.json.'
      }));
    }
  }

  if (backendPackageJson.scripts?.start && rootReadme && /Port 3000/i.test(rootReadme) === false) {
    evidence.push(createEvidenceRecord({
      id: 'EV-DD-003',
      source_type: 'file',
      location: join(repoRoot, 'apps', 'backend', 'package.json'),
      result: 'success',
      summary: 'Loaded backend manifest while comparing documented runtime commands.'
    }));
  }

  return { evidence, findings };
}
