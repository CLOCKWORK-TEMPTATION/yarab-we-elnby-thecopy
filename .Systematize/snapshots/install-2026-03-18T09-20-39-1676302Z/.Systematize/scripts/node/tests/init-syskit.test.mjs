import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  applyPlatformSelectionKey,
  buildPlatformStatus,
  createPlatformSelectionState,
  detectInstallation,
  expandPlatformOutputTargets,
  isAffirmativeAnswer,
  parsePlatformSelectionAnswer,
  translatePlatformStatusForPrompt
} from '../lib/init-syskit.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function createTempRepo() {
  return mkdtempSync(join(tmpdir(), 'syskit-init-test-'));
}

function runNodeInit(args) {
  const output = execFileSync(
    'node',
    ['.Systematize/scripts/node/cli.mjs', 'init', '--json', ...args],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  return JSON.parse(output);
}

function runPowerShellInit(args) {
  const output = execFileSync(
    'pwsh',
    ['-File', '.Systematize/scripts/powershell/init-syskit.ps1', '-Json', ...args],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  return JSON.parse(output);
}

test('expands root platform outputs into declared mirror directories only', () => {
  const outputs = expandPlatformOutputTargets({
    output_files: ['CLAUDE.md', '.cursor/rules/syskit-rules.mdc'],
    mirror_directories: ['.claude']
  });

  assert.deepEqual(outputs, [
    'CLAUDE.md',
    join('.claude', 'CLAUDE.md'),
    '.cursor/rules/syskit-rules.mdc'
  ]);
});

test('reports partial platform presence from expanded managed outputs', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(join(repoRoot, 'CLAUDE.md'), 'existing');

    const status = buildPlatformStatus({
      key: 'claude',
      display_name: 'Claude Code',
      output_files: ['CLAUDE.md'],
      mirror_directories: ['.claude']
    }, repoRoot);

    assert.equal(status.status, 'موجود جزئيًا');
    assert.deepEqual(status.existing_outputs, ['CLAUDE.md']);
    assert.deepEqual(status.managed_outputs, ['CLAUDE.md', join('.claude', 'CLAUDE.md')]);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('detects prior installation from state file before falling back to legacy markers', () => {
  const repoRoot = createTempRepo();

  try {
    const statePath = join(repoRoot, '.Systematize', 'memory', 'install-state.json');
    mkdirSync(join(repoRoot, '.Systematize', 'memory'), { recursive: true });
    writeFileSync(statePath, JSON.stringify({ schema_version: 1 }, null, 2));

    const detection = detectInstallation(repoRoot);
    assert.equal(detection.detected, true);
    assert.equal(detection.mode, 'state');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('detects legacy installations from core marker files', () => {
  const repoRoot = createTempRepo();

  try {
    mkdirSync(join(repoRoot, 'commands'), { recursive: true });
    mkdirSync(join(repoRoot, '.Systematize', 'config'), { recursive: true });
    mkdirSync(join(repoRoot, '.Systematize', 'templates'), { recursive: true });

    writeFileSync(join(repoRoot, 'commands', 'syskit.init.md'), '');
    writeFileSync(join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'), '');
    writeFileSync(join(repoRoot, '.Systematize', 'templates', 'agent-file-template.md'), '');

    const detection = detectInstallation(repoRoot);
    assert.equal(detection.detected, true);
    assert.equal(detection.mode, 'legacy');
    assert.equal(detection.markers_found.length, 3);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('parses platform selection answers from keys, indexes, and all aliases', () => {
  const statuses = [
    { key: 'claude' },
    { key: 'codex' },
    { key: 'copilot' }
  ];

  assert.deepEqual(parsePlatformSelectionAnswer('', statuses), ['claude', 'codex', 'copilot']);
  assert.deepEqual(parsePlatformSelectionAnswer('all', statuses), ['claude', 'codex', 'copilot']);
  assert.deepEqual(parsePlatformSelectionAnswer('2, claude', statuses), ['claude', 'codex']);
  assert.equal(parsePlatformSelectionAnswer('unknown', statuses), null);
});

test('parses affirmative answers for reinstall approval', () => {
  assert.equal(isAffirmativeAnswer('yes'), true);
  assert.equal(isAffirmativeAnswer('نعم'), true);
  assert.equal(isAffirmativeAnswer('موافق'), true);
  assert.equal(isAffirmativeAnswer('no'), false);
});

test('applies arrow and space selection keys for multi-select prompt state', () => {
  const platforms = [
    { key: 'claude' },
    { key: 'codex' },
    { key: 'copilot' }
  ];

  let state = createPlatformSelectionState(platforms);
  assert.deepEqual([...state.selectedKeys], ['claude', 'codex', 'copilot']);

  ({ state } = applyPlatformSelectionKey(state, { name: 'down' }, platforms));
  assert.equal(state.cursorIndex, 1);

  ({ state } = applyPlatformSelectionKey(state, { name: 'space' }, platforms));
  assert.deepEqual([...state.selectedKeys], ['claude', 'copilot']);

  ({ state } = applyPlatformSelectionKey(state, { name: 'return' }, platforms));
  assert.equal(state.message, '');
});

test('translates platform prompt statuses into english labels', () => {
  assert.equal(translatePlatformStatusForPrompt('موجود بالكامل'), 'fully present');
  assert.equal(translatePlatformStatusForPrompt('موجود جزئيًا'), 'partially present');
  assert.equal(translatePlatformStatusForPrompt('غير موجود'), 'not present');
});

test('node init creates install state, mirror outputs, and reinstall snapshots', () => {
  const repoRoot = createTempRepo();

  try {
    const initial = runNodeInit(['--target-path', repoRoot, '--platforms', 'claude']);
    assert.equal(initial.installation_detected, false);
    assert.equal(initial.reinstall_performed, false);
    assert.deepEqual(initial.selected_platforms, ['claude']);
    assert.equal(existsSync(join(repoRoot, 'CLAUDE.md')), true);
    assert.equal(existsSync(join(repoRoot, '.claude', 'CLAUDE.md')), true);
    assert.equal(existsSync(join(repoRoot, 'AGENTS.md')), false);

    const state = JSON.parse(readFileSync(join(repoRoot, '.Systematize', 'memory', 'install-state.json'), 'utf8'));
    assert.deepEqual(state.selected_platforms, ['claude']);

    const reinstall = runNodeInit(['--target-path', repoRoot, '--platforms', 'claude']);
    assert.equal(reinstall.installation_detected, true);
    assert.equal(reinstall.reinstall_performed, true);
    assert.equal(reinstall.overwrite_mode, 'non_interactive');
    assert.ok(reinstall.snapshot_path);
    assert.ok(reinstall.overwritten_count > 0);
    assert.equal(existsSync(join(reinstall.snapshot_path, 'CLAUDE.md')), true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('powershell init follows the same reinstall and platform-scope contract', () => {
  const repoRoot = createTempRepo();

  try {
    const initial = runPowerShellInit(['-TargetPath', repoRoot, '-Platforms', 'claude']);
    assert.equal(initial.installation_detected, false);
    assert.equal(initial.reinstall_performed, false);
    assert.deepEqual(initial.selected_platforms, ['claude']);
    assert.equal(existsSync(join(repoRoot, '.claude', 'CLAUDE.md')), true);
    assert.equal(existsSync(join(repoRoot, 'AGENTS.md')), false);

    const reinstall = runPowerShellInit(['-TargetPath', repoRoot, '-Platforms', 'claude']);
    assert.equal(reinstall.installation_detected, true);
    assert.equal(reinstall.reinstall_performed, true);
    assert.equal(reinstall.overwrite_mode, 'non_interactive');
    assert.ok(reinstall.snapshot_path);
    assert.ok(reinstall.overwritten_count > 0);
    assert.equal(existsSync(join(reinstall.snapshot_path, 'CLAUDE.md')), true);
    assert.equal(existsSync(join(repoRoot, 'AGENTS.md')), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
