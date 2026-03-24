import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  appendAcceptedMirrorOutputs,
  getDetectedMirrorCandidates,
  isAffirmativeAnswer
} from '../lib/init-syskit.mjs';

function createTempRepo() {
  return mkdtempSync(join(tmpdir(), 'syskit-init-test-'));
}

test('detects existing agent directories as optional mirror targets', () => {
  const repoRoot = createTempRepo();

  try {
    mkdirSync(join(repoRoot, '.claude'), { recursive: true });
    mkdirSync(join(repoRoot, '.codex'), { recursive: true });

    const platforms = [
      {
        key: 'claude',
        display_name: 'Claude Code',
        mirror_directories: ['.claude'],
        output_files: ['CLAUDE.md']
      },
      {
        key: 'codex',
        display_name: 'Codex CLI',
        mirror_directories: ['.codex'],
        output_files: ['AGENTS.md']
      }
    ];

    const candidates = getDetectedMirrorCandidates(platforms, repoRoot);
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].mirrorRelativePath, join('.claude', 'CLAUDE.md'));
    assert.equal(candidates[1].mirrorRelativePath, join('.codex', 'AGENTS.md'));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('adds accepted mirror outputs to the grouped output map', () => {
  const groupedOutputs = new Map([
    ['CLAUDE.md', ['Claude Code']],
    ['AGENTS.md', ['Codex CLI']]
  ]);

  appendAcceptedMirrorOutputs(groupedOutputs, {
    acceptedPaths: [join('.claude', 'CLAUDE.md')],
    candidates: [
      {
        displayName: 'Claude Code',
        mirrorRelativePath: join('.claude', 'CLAUDE.md')
      },
      {
        displayName: 'Codex CLI',
        mirrorRelativePath: join('.codex', 'AGENTS.md')
      }
    ]
  });

  assert.deepEqual(groupedOutputs.get(join('.claude', 'CLAUDE.md')), ['Claude Code']);
  assert.equal(groupedOutputs.has(join('.codex', 'AGENTS.md')), false);
});

test('parses affirmative answers for interactive mirror prompts', () => {
  assert.equal(isAffirmativeAnswer('yes'), true);
  assert.equal(isAffirmativeAnswer('نعم'), true);
  assert.equal(isAffirmativeAnswer('موافق'), true);
  assert.equal(isAffirmativeAnswer('no'), false);
});
