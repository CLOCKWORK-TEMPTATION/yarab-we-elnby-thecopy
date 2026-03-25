import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detectReviewVerdict, getRuntimeContract } from '../lib/command-runtime-contracts.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const cliPath = join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs');

function createTempRepo() {
  const tempRepo = join(tmpdir(), `syskit-review-contract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const featureDir = join(tempRepo, 'features', '001-review-contract');

  mkdirSync(join(tempRepo, '.Systematize', 'config'), { recursive: true });
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, 'sys.md'), '# Sys\n', 'utf8');
  writeFileSync(join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
  writeFileSync(join(featureDir, 'tasks.md'), '# Tasks\n', 'utf8');
  writeFileSync(join(tempRepo, '.Systematize', 'config', 'syskit-config.yml'), 'version: 2.0\n', 'utf8');

  return { tempRepo, featureDir };
}

test('setup-review runtime contract requires the strict executive report sections', () => {
  const contract = getRuntimeContract('setup-review');
  assert.deepEqual(contract.required_output_sections, [
    '## Executive Summary',
    '## Critical Issues Table',
    '## Layer-by-Layer Findings',
    '## Confidence and Coverage',
    '## Repair Priority Map',
    '## Action Plan'
  ]);
});

test('detectReviewVerdict reads verdict lines from the executive summary layout', () => {
  const { tempRepo, featureDir } = createTempRepo();

  try {
    const reviewPath = join(featureDir, 'review.md');
    writeFileSync(reviewPath, [
      '# Review',
      '## Executive Summary',
      '**Verdict**: 🟡 APPROVED WITH CONDITIONS',
      '## Critical Issues Table',
      '## Layer-by-Layer Findings',
      '## Confidence and Coverage',
      '## Repair Priority Map',
      '## Action Plan'
    ].join('\n'), 'utf8');

    const result = detectReviewVerdict(reviewPath);
    assert.equal(result.status, 'accepted');
    assert.match(result.verdict, /APPROVED WITH CONDITIONS/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-implement accepts review artifacts that use the new executive summary verdict line', () => {
  const { tempRepo, featureDir } = createTempRepo();

  try {
    writeFileSync(join(featureDir, 'review.md'), [
      '# Review',
      '## Executive Summary',
      '**Verdict**: 🟢 APPROVED',
      '## Critical Issues Table',
      '## Layer-by-Layer Findings',
      '## Confidence and Coverage',
      '## Repair Priority Map',
      '## Action Plan'
    ].join('\n'), 'utf8');

    const output = execFileSync(
      'node',
      [cliPath, 'setup-implement', '--json', '--branch', '001-review-contract'],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    assert.equal(result.validation.status, 'accepted');
    assert.match(result.review_verdict, /APPROVED/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
