import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPowerShell } from './helpers/powershell.mjs';

import { getFeatureWorkspaceRoot } from '../lib/common.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const legacyWorkspaceName = Buffer.from('c3BlY3M=', 'base64').toString('utf8');
const powerShellAvailable = hasPowerShell();

function createTempRepo() {
  const tempRepo = join(tmpdir(), `syskit-workflow-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRepo, { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: tempRepo, stdio: 'pipe' });
  mkdirSync(join(tempRepo, '.Systematize', 'templates'), { recursive: true });
  mkdirSync(join(tempRepo, '.Systematize', 'memory'), { recursive: true });
  writeFileSync(join(tempRepo, '.Systematize', 'templates', 'plan-template.md'), '# Plan\n', 'utf8');
  return tempRepo;
}

function captureCommandFailure(runCommand) {
  try {
    runCommand();
  } catch (error) {
    return `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`;
  }

  throw new Error('Expected command to fail, but it succeeded.');
}

function writeCompleteConstitution(tempRepo) {
  writeFileSync(
    join(tempRepo, '.Systematize', 'memory', 'constitution.md'),
    '# Constitution\n\n## ٢٧. تقييم الاكتمال\n- complete\n',
    'utf8'
  );
}

function writeCompleteResearch(featureDir) {
  writeFileSync(
    join(featureDir, 'research.md'),
    '# Research\n\nAll findings resolved.\n',
    'utf8'
  );
}

function writeClarifiedSys(featureDir) {
  writeFileSync(
    join(featureDir, 'sys.md'),
    [
      '# Sys',
      '',
      '## Clarification Contract',
      '',
      '### What Is Required',
      '- Deliver the core user flow.',
      '',
      '### What Is NOT Required',
      '- No admin console.',
      '',
      '### Constraints',
      '- Browser-based delivery only.',
      '',
      '### Assumptions',
      '- **ASM-001**: Browser access exists — Reason: standard runtime — If wrong: client scope changes',
      '',
      '### Critical Questions Resolved',
      '- Q: Is authentication required? → A: Yes → Impact: security rules',
      '',
      '### Success Criteria',
      '- Users can complete the primary flow.',
      '',
      '### Clarification Checklist',
      '| # | Item | Status |',
      '|---|------|--------|',
      '| 1 | Scope defined | ☐ Yes |',
      '| 2 | Excluded scope defined | ☐ Yes |',
      '| 3 | Constraints documented | ☐ Yes |',
      '| 4 | Assumptions documented with impact | ☐ Yes |',
      '| 5 | Critical unknowns resolved | ☐ Yes |',
      '| 6 | Execution can proceed without recurring user queries | ☐ Yes |',
      '',
      '---',
      '',
      '## Level 3: Requirements',
      '- Filled.'
    ].join('\n'),
    'utf8'
  );
}

test('detects conflicting workflow roots and forces manual resolution', () => {
  const tempRepo = createTempRepo();

  try {
    mkdirSync(join(tempRepo, 'features'), { recursive: true });
    mkdirSync(join(tempRepo, legacyWorkspaceName), { recursive: true });

    assert.throws(
      () => getFeatureWorkspaceRoot(tempRepo),
      /Conflicting workflow roots detected/
    );
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-plan migrates the legacy workflow root and writes into features', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const legacyFeatureDir = join(tempRepo, legacyWorkspaceName, branchName);

  try {
    mkdirSync(legacyFeatureDir, { recursive: true });
    writeClarifiedSys(legacyFeatureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(legacyFeatureDir);

    const output = execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'setup-plan', '--json', '--branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    const migratedFeatureDir = join(tempRepo, 'features', branchName);

    assert.equal(result.FEATURES_DIR, migratedFeatureDir);
    assert.equal(result.AMINOOOF_DIR, undefined, 'AMINOOOF_DIR legacy alias must not appear in output');
    assert.equal(existsSync(migratedFeatureDir), true);
    assert.equal(existsSync(legacyFeatureDir), false);
    assert.equal(existsSync(join(migratedFeatureDir, 'plan.md')), true);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-plan composes the full base template with the active preset overlay', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(join(tempRepo, '.Systematize', 'presets', 'web-fullstack', 'templates'), { recursive: true });
    writeFileSync(
      join(tempRepo, '.Systematize', 'presets', '.registry'),
      JSON.stringify({
        schema_version: 1,
        active_preset: 'web-fullstack',
        presets: {
          'web-fullstack': { priority: 1, description: 'Full-stack web application' }
        }
      }, null, 2),
      'utf8'
    );
    writeFileSync(
      join(tempRepo, '.Systematize', 'presets', 'web-fullstack', 'templates', 'plan-template.md'),
      '## Preset Overlay\nPreset-specific section.\n',
      'utf8'
    );

    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(featureDir);

    execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'setup-plan', '--json', '--branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const planContent = readFileSync(join(featureDir, 'plan.md'), 'utf8');
    assert.match(planContent, /# Plan/);
    assert.match(planContent, /## Preset Overlay/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('powershell setup-plan migrates the legacy workflow root and writes into features', { skip: !powerShellAvailable }, () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const legacyFeatureDir = join(tempRepo, legacyWorkspaceName, branchName);

  try {
    mkdirSync(legacyFeatureDir, { recursive: true });
    writeClarifiedSys(legacyFeatureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(legacyFeatureDir);

    const output = execFileSync(
      'pwsh',
      ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', 'setup-plan.ps1'), '-Json', '-Branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    const migratedFeatureDir = join(tempRepo, 'features', branchName);

    assert.equal(result.FEATURES_DIR, migratedFeatureDir);
    assert.equal(result.AMINOOOF_DIR, undefined, 'AMINOOOF_DIR legacy alias must not appear in output');
    assert.equal(existsSync(migratedFeatureDir), true);
    assert.equal(existsSync(legacyFeatureDir), false);
    assert.equal(existsSync(join(migratedFeatureDir, 'plan.md')), true);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-plan blocks until constitution and research gates are complete', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);

    const constitutionFailure = captureCommandFailure(() => execFileSync(
        'node',
        [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'setup-plan', '--json', '--branch', branchName],
        { cwd: tempRepo, encoding: 'utf8', stdio: 'pipe' }
      ));
    assert.match(constitutionFailure, /constitution gate is not satisfied/i);

    writeCompleteConstitution(tempRepo);

    const researchFailure = captureCommandFailure(() => execFileSync(
        'node',
        [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'setup-plan', '--json', '--branch', branchName],
        { cwd: tempRepo, encoding: 'utf8', stdio: 'pipe' }
      ));
    assert.match(researchFailure, /research\.md is missing or incomplete/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('check-prerequisites allows research-before-plan once sys and constitution are ready', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);
  const env = { ...process.env, SYSTEMATIZE_FEATURE: branchName };

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);

    const output = execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'check-prerequisites', '--json'],
      { cwd: tempRepo, encoding: 'utf8', env }
    );

    const result = JSON.parse(output);
    assert.equal(result.FEATURE_DIR, featureDir);
    assert.deepEqual(result.AVAILABLE_DOCS, []);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('check-prerequisites fails explicitly when sys or constitution is missing before planning', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);
  const env = { ...process.env, SYSTEMATIZE_FEATURE: branchName };

  try {
    mkdirSync(featureDir, { recursive: true });

    const noSys = captureCommandFailure(() => execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'check-prerequisites', '--json'],
      { cwd: tempRepo, encoding: 'utf8', stdio: 'pipe', env }
    ));
    assert.match(noSys, /sys\.md not found/i);

    writeClarifiedSys(featureDir);

    const noConstitution = captureCommandFailure(() => execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'check-prerequisites', '--json'],
      { cwd: tempRepo, encoding: 'utf8', stdio: 'pipe', env }
    ));
    assert.match(noConstitution, /constitution gate is not satisfied/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('feature-status enforces constitution then research then plan as the next step order', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);

    const firstStatus = JSON.parse(execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'feature-status', '--json', '--branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(firstStatus.next_step, '/syskit.constitution');

    writeCompleteConstitution(tempRepo);
    const secondStatus = JSON.parse(execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'feature-status', '--json', '--branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(secondStatus.next_step, '/syskit.research');

    writeCompleteResearch(featureDir);
    const thirdStatus = JSON.parse(execFileSync(
      'node',
      [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'feature-status', '--json', '--branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(thirdStatus.next_step, '/syskit.plan');
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('powershell feature-status enforces constitution then research then plan as the next step order', { skip: !powerShellAvailable }, () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);

    const firstStatus = JSON.parse(execFileSync(
      'pwsh',
      ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', 'get-feature-status.ps1'), '-Json', '-Branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(firstStatus.next_step, '/syskit.constitution');

    writeCompleteConstitution(tempRepo);
    const secondStatus = JSON.parse(execFileSync(
      'pwsh',
      ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', 'get-feature-status.ps1'), '-Json', '-Branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(secondStatus.next_step, '/syskit.research');

    writeCompleteResearch(featureDir);
    const thirdStatus = JSON.parse(execFileSync(
      'pwsh',
      ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', 'get-feature-status.ps1'), '-Json', '-Branch', branchName],
      { cwd: tempRepo, encoding: 'utf8' }
    ));
    assert.equal(thirdStatus.next_step, '/syskit.plan');
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

// --- Regression guards: legacy aliases must never appear in setup outputs ---

const LEGACY_ALIAS_PATTERN = /AMINOOOF/;

function runSetupCommand(tempRepo, commandName, branchName) {
  return execFileSync(
    'node',
    [join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), commandName, '--json', '--branch', branchName],
    { cwd: tempRepo, encoding: 'utf8' }
  );
}

test('getFeaturePathsEnv does not expose AMINOOOF_DIR', async () => {
  const { getFeaturePathsEnv } = await import('../lib/common.mjs');
  const paths = getFeaturePathsEnv({ mutating: false });
  assert.equal(paths.AMINOOOF_DIR, undefined, 'AMINOOOF_DIR must not exist in getFeaturePathsEnv output');
  assert.ok(paths.FEATURE_DIR, 'FEATURE_DIR must be present');
  assert.ok(paths.FEATURES_DIR, 'FEATURES_DIR must be present');
});

test('setup-plan JSON output contains no legacy aliases', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-guard-plan';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(featureDir);

    const output = runSetupCommand(tempRepo, 'setup-plan', branchName);
    assert.equal(LEGACY_ALIAS_PATTERN.test(output), false, `setup-plan output must not contain legacy aliases: ${output}`);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-research JSON output contains no legacy aliases', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-guard-research';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);

    const output = runSetupCommand(tempRepo, 'setup-research', branchName);
    assert.equal(LEGACY_ALIAS_PATTERN.test(output), false, `setup-research output must not contain legacy aliases: ${output}`);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-tasks JSON output contains no legacy aliases', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-guard-tasks';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(featureDir);
    writeFileSync(join(featureDir, 'plan.md'), '# Plan\n\nAll sections filled.\n', 'utf8');

    const output = runSetupCommand(tempRepo, 'setup-tasks', branchName);
    assert.equal(LEGACY_ALIAS_PATTERN.test(output), false, `setup-tasks output must not contain legacy aliases: ${output}`);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
