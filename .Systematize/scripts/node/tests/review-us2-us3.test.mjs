import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { deriveConfidenceModel } from '../lib/review/confidence-model.mjs';
import { auditDevProductionBoundaries } from '../lib/review/dev-prod-audit.mjs';
import { createFinding } from '../lib/review/finding-schema.mjs';
import { normalizeFindings } from '../lib/review/normalize-findings.mjs';
import { buildRepairPriorityMap, buildFivePhaseActionPlan } from '../lib/review/repair-plan.mjs';

function createTempRepo() {
  const tempRepo = mkdtempSync(join(tmpdir(), 'syskit-review-us2-'));
  writeFileSync(
    join(tempRepo, 'package.json'),
    JSON.stringify({
      name: 'review-us2-fixture',
      scripts: {
        dev: 'node server.js'
      }
    }, null, 2),
    'utf8'
  );
  writeFileSync(join(tempRepo, '.env.local'), 'API_URL=http://localhost:3000\n', 'utf8');
  mkdirSync(join(tempRepo, 'src'), { recursive: true });
  return tempRepo;
}

test('confidence model degrades explicitly when checks are unavailable', () => {
  const result = deriveConfidenceModel({
    checkResults: [
      { name: 'lint', status: 'success' },
      { name: 'build', status: 'unavailable', command: 'npm run build' }
    ],
    skippedLayers: [{ layer: 'frontend', reason: 'No frontend detected.' }]
  });

  assert.equal(result.review_mode, 'Partial Execution Review');
  assert.equal(result.confidence, 'Medium');
  assert.ok(result.reasons.length >= 2);
});

test('dev-prod audit surfaces local-environment drift and missing build contract', () => {
  const tempRepo = createTempRepo();

  try {
    const audit = auditDevProductionBoundaries(tempRepo);
    assert.ok(audit.findings.some((finding) => finding.problem.includes('.env.local')));
    assert.ok(audit.findings.some((finding) => finding.problem.includes('dev script without a matching build script')));
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('normalizeFindings merges equivalent issues and repair plan keeps ETA-free phases', () => {
  const findings = normalizeFindings([
    createFinding({
      id: 'FD-001',
      type: 'confirmed_error',
      severity: 'critical',
      layer: 'toolchain',
      location: 'package.json',
      problem: 'Build path is missing.',
      evidence: 'No build script.',
      impact: 'No production artifact.',
      fix: 'Add a build script.'
    }),
    createFinding({
      id: 'FD-002',
      type: 'potential_risk',
      severity: 'high',
      layer: 'production',
      location: 'pnpm-workspace.yaml',
      problem: 'Build path is missing.',
      evidence: 'No root build contract.',
      impact: 'No production artifact.',
      fix: 'Add a build script.'
    })
  ]);

  assert.equal(findings.length, 1);

  const priorityMap = buildRepairPriorityMap(findings);
  const plan = buildFivePhaseActionPlan(findings);

  assert.equal(priorityMap['يجب إصلاحه فورًا'].length, 1);
  assert.match(JSON.stringify(plan), /المرحلة 1: إيقاف النزيف/);
  assert.equal(JSON.stringify(plan).includes('week'), false);
});
