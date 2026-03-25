import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { scanRepositoryInventory } from '../lib/review/inventory-scan.mjs';
import { runP1BaselineReview } from '../lib/review/p1-orchestrator.mjs';

function createTempRepo() {
  const tempRepo = mkdtempSync(join(tmpdir(), 'syskit-review-us1-'));
  mkdirSync(join(tempRepo, 'app'), { recursive: true });
  mkdirSync(join(tempRepo, 'backend'), { recursive: true });
  mkdirSync(join(tempRepo, 'packages'), { recursive: true });
  writeFileSync(
    join(tempRepo, 'package.json'),
    JSON.stringify({
      name: 'review-us1-fixture',
      packageManager: 'npm@10.0.0',
      scripts: {
        lint: 'node -e "console.log(\'lint-ok\')"',
        test: 'node -e "process.exit(1)"'
      }
    }, null, 2),
    'utf8'
  );
  return tempRepo;
}

test('inventory scanner detects package manager and multi-layer layout', () => {
  const tempRepo = createTempRepo();

  try {
    const inventory = scanRepositoryInventory(tempRepo);
    assert.equal(inventory.package_manager, 'npm');
    assert.deepEqual(inventory.detected_layers, ['frontend', 'server', 'shared']);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('p1 orchestrator produces a baseline summary and structural findings from failed checks', () => {
  const tempRepo = createTempRepo();

  try {
    const review = runP1BaselineReview(tempRepo, { execute: true, timeoutMs: 30000 });
    assert.match(review.summary, /Review Mode:/);
    assert.match(review.summary, /Top Issues:/);
    assert.ok(review.findings.length >= 1);
    assert.match(review.review_mode, /(Full|Partial) Execution Review/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
