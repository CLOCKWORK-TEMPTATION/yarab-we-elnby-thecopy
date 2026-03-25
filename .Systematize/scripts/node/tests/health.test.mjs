import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  evaluateFeatureHealth,
  getFeatureLastActivity,
  getTaskCompletionStats
} from '../lib/health.mjs';

function createFeatureDir() {
  const featureDir = mkdtempSync(join(tmpdir(), 'syskit-health-test-'));
  mkdirSync(featureDir, { recursive: true });
  return featureDir;
}

test('evaluates feature health with the shared 100-point rubric', () => {
  const featureDir = createFeatureDir();

  try {
    writeFileSync(
      join(featureDir, 'sys.md'),
      `# Sample Feature

| FR-001 | User submits a request | Valid payload | Persisted request |
| NFR-001 | Response latency <= 2 seconds |
| AC-001 | FR-001 | Request persists successfully |
| RK-001 | High | mitigation plan | owner | strategy |

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-03-18 | 1.0 | Initial version | system |
`,
      'utf8'
    );

    writeFileSync(
      join(featureDir, 'plan.md'),
      `# Implementation Plan

| FR-001 | Implement persistence workflow |

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-03-18 | 1.0 | Initial version | system |
`,
      'utf8'
    );

    const tasksContent = `### BE-T-001 — Persist request data

| Field | Value |
|-------|-------|
| **Source** | sys.md FR-001 |
| **Depends On** | None |

**Description:**
Persist request records using a dedicated service.

**Expected Outputs:**
- [ ] src/request-service.ts

**Acceptance Criteria:**
- [x] FR-001 persists the request successfully

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-03-18 | 1.0 | Initial version | system |
`;

    writeFileSync(join(featureDir, 'tasks.md'), tasksContent, 'utf8');

    const report = evaluateFeatureHealth(featureDir);
    assert.equal(report.maxScore, 100);
    assert.ok(report.score >= 70, `expected passing advisory score, received ${report.score}`);
    assert.equal(report.status, 'ADVISORY_PASS');
    assert.equal(report.scope, 'heuristic');
    assert.equal(report.checks.length, 10);

    const stats = getTaskCompletionStats(tasksContent);
    assert.deepEqual(stats, {
      totalTasks: 1,
      completedTasks: 1,
      completionPercent: 100
    });

    const lastActivity = getFeatureLastActivity(featureDir);
    assert.ok(lastActivity instanceof Date);
  } finally {
    rmSync(featureDir, { recursive: true, force: true });
  }
});

test('returns ADVISORY_FAIL when score falls below threshold', () => {
  const featureDir = createFeatureDir();

  try {
    writeFileSync(
      join(featureDir, 'sys.md'),
      `# Broken Feature

| FR-001 | A fast and easy feature | input | output |
| FR-003 | Skipped sequence | input | output |
[NEEDS CLARIFICATION: everything]
[TBD: nothing decided]
`,
      'utf8'
    );

    const report = evaluateFeatureHealth(featureDir, 90);
    assert.equal(report.scope, 'heuristic', 'scope must always be heuristic');
    assert.equal(report.status, 'ADVISORY_FAIL', 'below-threshold score must produce advisory fail');
    assert.ok(report.score < 90, `expected score below 90, received ${report.score}`);
  } finally {
    rmSync(featureDir, { recursive: true, force: true });
  }
});

test('heuristic checks never claim authoritative production status', () => {
  const featureDir = createFeatureDir();

  try {
    writeFileSync(join(featureDir, 'sys.md'), '# Minimal\n\n## Changelog\n', 'utf8');
    const report = evaluateFeatureHealth(featureDir);
    assert.equal(report.scope, 'heuristic');
    assert.ok(
      report.status === 'ADVISORY_PASS' || report.status === 'ADVISORY_FAIL',
      `status must use advisory labels, got: ${report.status}`
    );
    assert.notEqual(report.status, 'HEALTHY', 'must not use HEALTHY as status');
    assert.notEqual(report.status, 'UNHEALTHY', 'must not use UNHEALTHY as status');
  } finally {
    rmSync(featureDir, { recursive: true, force: true });
  }
});
