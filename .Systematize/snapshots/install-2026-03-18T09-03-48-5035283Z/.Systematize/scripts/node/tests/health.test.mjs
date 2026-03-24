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
    assert.ok(report.score >= 70, `expected healthy score, received ${report.score}`);
    assert.equal(report.status, 'HEALTHY');
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
