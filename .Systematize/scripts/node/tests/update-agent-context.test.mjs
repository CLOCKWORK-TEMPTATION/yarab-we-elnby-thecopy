import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const cliPath = join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs');

function createTempRepo() {
  const tempRepo = mkdtempSync(join(tmpdir(), 'syskit-agent-context-'));
  mkdirSync(join(tempRepo, '.Systematize', 'templates'), { recursive: true });
  mkdirSync(join(tempRepo, 'features', '001-demo-flow'), { recursive: true });
  writeFileSync(
    join(tempRepo, '.Systematize', 'templates', 'agent-file-template.md'),
    readFileSync(join(repoRoot, '.Systematize', 'templates', 'agent-file-template.md'), 'utf8'),
    'utf8'
  );
  return tempRepo;
}

function runUpdate(tempRepo, branchName) {
  return execFileSync(
    'node',
    [cliPath, 'update-agent-context', '--agent-type', 'claude', '--branch', branchName, '--json'],
    { cwd: tempRepo, encoding: 'utf8' }
  );
}

test('update-agent-context reads Technical Context table fields directly', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const planPath = join(tempRepo, 'features', branchName, 'plan.md');

  try {
    writeFileSync(
      planPath,
      [
        '## 2. Technical Context',
        '',
        '| Field | Value |',
        '|-------|-------|',
        '| **Language/Version** | TypeScript 5.7 |',
        '| **Primary Dependencies** | pnpm + turbo |',
        '| **Storage** | local filesystem |',
        '| **Testing Framework** | node --test |',
        '| **Target Platform** | Windows and Linux shells |',
        '| **Project Type** | governance cli |'
      ].join('\n'),
      'utf8'
    );

    const result = JSON.parse(runUpdate(tempRepo, branchName));
    const claudePath = join(tempRepo, 'CLAUDE.md');

    assert.equal(existsSync(claudePath), true);
    assert.equal(result.created.includes(claudePath), true);
    assert.match(readFileSync(claudePath, 'utf8'), /TypeScript 5\.7 \+ pnpm \+ turbo/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('update-agent-context falls back to Agent Context Seed when table fields are absent', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const planPath = join(tempRepo, 'features', branchName, 'plan.md');

  try {
    writeFileSync(
      planPath,
      [
        '## 2. Technical Context',
        '',
        '| Field | Value |',
        '|-------|-------|',
        '| **Language/Version** | N/A |',
        '',
        '### 2.1 Agent Context Seed',
        '',
        '**Language/Version**: JavaScript ESM on Node.js >=18',
        '**Primary Dependencies**: pnpm + turbo + syskit templates',
        '**Storage**: local filesystem only',
        '**Testing Framework**: node --test',
        '**Target Platform**: Windows and Linux shell workflows',
        '**Project Type**: internal governance cli'
      ].join('\n'),
      'utf8'
    );

    runUpdate(tempRepo, branchName);
    const claudeContent = readFileSync(join(tempRepo, 'CLAUDE.md'), 'utf8');
    assert.match(claudeContent, /JavaScript ESM on Node\.js >=18 \+ pnpm \+ turbo \+ syskit templates/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('update-agent-context fails when critical fields are missing from both the table and the seed', () => {
  const tempRepo = createTempRepo();
  const branchName = '001-demo-flow';
  const planPath = join(tempRepo, 'features', branchName, 'plan.md');

  try {
    writeFileSync(planPath, '## 2. Technical Context\n', 'utf8');
    const result = spawnSync(
      'node',
      [cliPath, 'update-agent-context', '--agent-type', 'claude', '--branch', branchName, '--json'],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing critical plan fields/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
