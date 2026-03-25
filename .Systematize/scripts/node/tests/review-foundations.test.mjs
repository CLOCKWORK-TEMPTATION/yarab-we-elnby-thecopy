import test from 'node:test';
import assert from 'node:assert/strict';

import { createEvidenceRecord } from '../lib/review/evidence-schema.mjs';
import { buildFindingSignature, createFinding } from '../lib/review/finding-schema.mjs';
import { createGateStatus } from '../lib/review/gate-status.mjs';
import { createReviewRequestContext } from '../lib/review/request-context.mjs';

test('createReviewRequestContext enforces explicit branch, paths, and requested output', () => {
  const context = createReviewRequestContext({
    id: 'RR-001',
    branch: '003-strict-code-review',
    source_command: 'syskit.review',
    feature_dir: 'E:/repo/features/003-strict-code-review',
    requested_output: 'E:/repo/features/003-strict-code-review/review.md',
    required_artifacts: ['sys.md', 'plan.md', 'tasks.md'],
    paths: {
      sys: 'E:/repo/features/003-strict-code-review/sys.md',
      plan: 'E:/repo/features/003-strict-code-review/plan.md'
    }
  });

  assert.equal(context.branch, '003-strict-code-review');
  assert.deepEqual(context.required_artifacts, ['sys.md', 'plan.md', 'tasks.md']);
});

test('createGateStatus rejects ready states with blockers', () => {
  assert.throws(() => createGateStatus({
    gate: 'review-artifact',
    status: 'ready',
    blocker: {
      reason: 'Missing report file'
    }
  }), /ready gate status cannot carry an open blocker/i);
});

test('createEvidenceRecord requires a command when the source type is command', () => {
  assert.throws(() => createEvidenceRecord({
    id: 'EV-001',
    source_type: 'command',
    location: 'package.json',
    result: 'failure',
    summary: 'Command failed'
  }), /command is required/i);
});

test('createFinding enforces required fields and builds a deterministic signature', () => {
  const finding = createFinding({
    id: 'FD-001',
    type: 'confirmed_error',
    severity: 'high',
    layer: 'toolchain',
    location: 'package.json',
    problem: 'Missing test script',
    evidence: 'package.json has no test entry',
    impact: 'Automated validation cannot run',
    fix: 'Add a deterministic test command'
  });

  assert.equal(
    buildFindingSignature(finding),
    'confirmed_error::high::toolchain::package.json::missing test script'
  );
});
