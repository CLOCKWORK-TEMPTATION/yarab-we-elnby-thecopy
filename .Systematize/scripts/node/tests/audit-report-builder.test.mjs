import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { buildAuditReport } from '../lib/audit-report-builder.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function sampleFinding(findingId, severity, layer, problem) {
  return {
    findingId,
    type: 'خطأ مؤكد',
    severity,
    layer,
    location: `E:/repo/${findingId}`,
    problem,
    evidence: `${findingId} evidence`,
    impact: `${findingId} impact`,
    fix: `${findingId} fix`,
    mergedFrom: []
  };
}

test('audit report builder emits the six required sections in order', () => {
  const report = buildAuditReport({
    featureName: 'Platform Multi-Layer Audit',
    branch: '002-audit-platform-apps',
    reviewer: 'AI Review',
    findingsBySection: {
      packageToolchain: [sampleFinding('CFG-001', 'عالٍ', 'config', 'Config drift detected.')],
      automatedChecks: [sampleFinding('CHK-001', 'متوسط', 'toolchain', 'Build command is partial.')],
      devVsProduction: [],
      serverApi: [],
      sharedLogic: [],
      frontend: [],
      frontendBackendIntegration: [],
      security: [],
      performanceAndProductionReadiness: []
    },
    checkResults: [
      { checkName: 'lint', status: 'executed' },
      { checkName: 'type-check', status: 'executed' },
      { checkName: 'test', status: 'executed' },
      { checkName: 'build', status: 'executed' }
    ],
    targets: [
      { relativePath: 'apps/web/src/app/(main)/brainstorm', coverageStatus: 'inspected' }
    ]
  });

  const sectionPositions = [
    report.indexOf('## Executive Summary'),
    report.indexOf('## Critical Issues Table'),
    report.indexOf('## Layer-by-Layer Findings'),
    report.indexOf('## Confidence and Coverage'),
    report.indexOf('## Repair Priority Map'),
    report.indexOf('## Action Plan')
  ];

  assert.ok(sectionPositions.every((position) => position >= 0));
  assert.deepEqual([...sectionPositions].sort((left, right) => left - right), sectionPositions);
});

test('powershell audit report builder emits the same governing sections', () => {
  const command = `
. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'finding-normalizer.ps1')}'
. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'confidence-policy.ps1')}'
. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'confidence-statement-builder.ps1')}'
. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'audit-report-builder.ps1')}'
$inputObject = [pscustomobject]@{
  featureName = 'Platform Multi-Layer Audit'
  branch = '002-audit-platform-apps'
  findingsBySection = @{
    packageToolchain = @([pscustomobject]@{ findingId = 'CFG-001'; type = 'خطأ مؤكد'; severity = 'عالٍ'; layer = 'config'; location = 'E:/repo/CFG-001'; problem = 'Config drift detected.'; evidence = 'evidence'; impact = 'impact'; fix = 'fix'; mergedFrom = @() })
    automatedChecks = @()
    devVsProduction = @()
    serverApi = @()
    sharedLogic = @()
    frontend = @()
    frontendBackendIntegration = @()
    security = @()
    performanceAndProductionReadiness = @()
  }
  checkResults = @(
    [pscustomobject]@{ checkName = 'lint'; status = 'executed' },
    [pscustomobject]@{ checkName = 'type-check'; status = 'executed' },
    [pscustomobject]@{ checkName = 'test'; status = 'executed' },
    [pscustomobject]@{ checkName = 'build'; status = 'executed' }
  )
  targets = @([pscustomobject]@{ relativePath = 'apps/web/src/app/(main)/brainstorm'; coverageStatus = 'inspected' })
}
$report = Build-AuditReport -InputObject $inputObject
$report
`;

  const report = execFileSync('pwsh', ['-NoLogo', '-Command', command], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.match(report, /## Executive Summary/);
  assert.match(report, /## Critical Issues Table/);
  assert.match(report, /## Layer-by-Layer Findings/);
  assert.match(report, /## Confidence and Coverage/);
  assert.match(report, /## Repair Priority Map/);
  assert.match(report, /## Action Plan/);
});
