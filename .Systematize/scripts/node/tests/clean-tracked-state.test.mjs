import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertTrackedStateMatches, collectTrackedState } from '../lib/clean-tracked-state.mjs';

const repoRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const verifyCleanTreeScript = join(repoRoot, '.Systematize', 'scripts', 'node', 'lib', 'verify-clean-tree.mjs');

function createTrackedRepo() {
  const tempRepo = mkdtempSync(join(tmpdir(), 'syskit-clean-tree-'));
  writeFileSync(join(tempRepo, 'tracked.txt'), 'baseline\n', 'utf8');
  execFileSync('git', ['init', '-q'], { cwd: tempRepo, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 'Codex Test'], { cwd: tempRepo, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 'codex@example.com'], { cwd: tempRepo, stdio: 'pipe' });
  execFileSync('git', ['add', 'tracked.txt'], { cwd: tempRepo, stdio: 'pipe' });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: tempRepo, stdio: 'pipe' });
  return tempRepo;
}

function runVerifyCleanTree(tempRepo) {
  return execFileSync(
    'node',
    [verifyCleanTreeScript, '--json'],
    { cwd: tempRepo, encoding: 'utf8', stdio: 'pipe' }
  );
}

function captureCommandFailure(runCommand) {
  try {
    runCommand();
  } catch (error) {
    return `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`;
  }

  throw new Error('Expected command to fail, but it succeeded.');
}

test('verify-clean-tree passes when tracked repository state is clean', () => {
  const tempRepo = createTrackedRepo();

  try {
    const result = JSON.parse(runVerifyCleanTree(tempRepo));
    assert.deepEqual(result, {
      working_tree_files: [],
      staged_files: [],
      tracked_files: []
    });
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('verify-clean-tree fails when tracked working tree files drift', () => {
  const tempRepo = createTrackedRepo();

  try {
    writeFileSync(join(tempRepo, 'tracked.txt'), 'changed\n', 'utf8');

    const failure = captureCommandFailure(() => runVerifyCleanTree(tempRepo));
    assert.match(failure, /Tracked repository state is dirty\./);
    assert.match(failure, /Working tree changes:/);
    assert.match(failure, /tracked\.txt/);
    assert.equal(readFileSync(join(tempRepo, 'tracked.txt'), 'utf8'), 'changed\n');
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('verify-clean-tree fails when staged tracked files drift', () => {
  const tempRepo = createTrackedRepo();

  try {
    writeFileSync(join(tempRepo, 'tracked.txt'), 'staged-change\n', 'utf8');
    execFileSync('git', ['add', 'tracked.txt'], { cwd: tempRepo, stdio: 'pipe' });

    const failure = captureCommandFailure(() => runVerifyCleanTree(tempRepo));
    assert.match(failure, /Tracked repository state is dirty\./);
    assert.match(failure, /Staged index changes:/);
    assert.match(failure, /tracked\.txt/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('tracked state matcher accepts a stable dirty baseline without introducing extra drift', () => {
  const tempRepo = createTrackedRepo();

  try {
    writeFileSync(join(tempRepo, 'tracked.txt'), 'stable-dirty-state\n', 'utf8');
    const baseline = collectTrackedState(tempRepo);
    const actual = assertTrackedStateMatches(tempRepo, baseline, 'Tracked repository state');

    assert.deepEqual(actual, {
      working_tree_files: ['tracked.txt'],
      staged_files: [],
      tracked_files: ['tracked.txt']
    });
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
