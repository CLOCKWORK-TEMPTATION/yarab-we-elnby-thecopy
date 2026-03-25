import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPowerShell } from './helpers/powershell.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const cliPath = join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs');
const powerShellAvailable = hasPowerShell();

function createTempRepo() {
  const tempRepo = join(tmpdir(), `syskit-powershell-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRepo, { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: tempRepo, stdio: 'pipe' });
  mkdirSync(join(tempRepo, '.Systematize', 'templates'), { recursive: true });
  mkdirSync(join(tempRepo, '.Systematize', 'memory'), { recursive: true });
  writeFileSync(join(tempRepo, '.Systematize', 'templates', 'plan-template.md'), '# Plan\n', 'utf8');
  return tempRepo;
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

function runNodeJson(tempRepo, args, env = {}) {
  return JSON.parse(execFileSync(
    'node',
    [cliPath, ...args, '--json'],
    {
      cwd: tempRepo,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: 'pipe'
    }
  ));
}

function runPowerShellJson(tempRepo, scriptName, args, env = {}) {
  return JSON.parse(execFileSync(
    'pwsh',
    ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', scriptName), '-Json', ...args],
    {
      cwd: tempRepo,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: 'pipe'
    }
  ));
}

function runNodeFailure(tempRepo, args, env = {}) {
  return spawnSync(
    'node',
    [cliPath, ...args, '--json'],
    {
      cwd: tempRepo,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: 'pipe'
    }
  );
}

function runPowerShellFailure(tempRepo, scriptName, args, env = {}) {
  return spawnSync(
    'pwsh',
    ['-File', join(repoRoot, '.Systematize', 'scripts', 'powershell', scriptName), '-Json', ...args],
    {
      cwd: tempRepo,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: 'pipe'
    }
  );
}

test('PowerShell check-prerequisites matches Node JSON output for satisfied prerequisites', { skip: !powerShellAvailable }, () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);
    writeFileSync(join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
    writeFileSync(join(featureDir, 'tasks.md'), '# Tasks\n', 'utf8');

    const env = { SYSTEMATIZE_FEATURE: branchName };
    const nodeResult = runNodeJson(tempRepo, ['check-prerequisites', '--require-tasks', '--include-tasks'], env);
    const powerShellResult = runPowerShellJson(tempRepo, 'check-prerequisites.ps1', ['-RequireTasks', '-IncludeTasks'], env);

    assert.deepEqual(powerShellResult, nodeResult);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('PowerShell check-prerequisites preserves the Node failure contract', { skip: !powerShellAvailable }, () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';

  try {
    const env = { SYSTEMATIZE_FEATURE: branchName };
    const nodeResult = runNodeFailure(tempRepo, ['check-prerequisites', '--require-tasks'], env);
    const powerShellResult = runPowerShellFailure(tempRepo, 'check-prerequisites.ps1', ['-RequireTasks'], env);

    assert.notEqual(nodeResult.status, 0);
    assert.equal(powerShellResult.status, nodeResult.status);
    assert.match(nodeResult.stderr, /Feature directory not found/);
    assert.match(powerShellResult.stderr, /Feature directory not found/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('PowerShell feature-status matches Node JSON output for the gated workflow state', { skip: !powerShellAvailable }, () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const featureDir = join(tempRepo, 'features', branchName);

  try {
    mkdirSync(featureDir, { recursive: true });
    writeClarifiedSys(featureDir);
    writeCompleteConstitution(tempRepo);
    writeCompleteResearch(featureDir);
    writeFileSync(join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
    mkdirSync(join(featureDir, 'checklists'), { recursive: true });
    writeFileSync(join(featureDir, 'checklists', 'gate.md'), '# Checklist\n', 'utf8');

    const nodeResult = runNodeJson(tempRepo, ['feature-status', '--branch', branchName]);
    const powerShellResult = runPowerShellJson(tempRepo, 'get-feature-status.ps1', ['-Branch', branchName]);

    assert.deepEqual(powerShellResult, nodeResult);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
