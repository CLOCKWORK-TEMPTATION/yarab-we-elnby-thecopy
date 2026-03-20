import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { getAuditTargets } from '../lib/audit-target-registry.mjs';
import { classifyTargetScope } from '../lib/target-scope-classifier.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

test('web targets mark server layer as out_of_scope', () => {
  const webTarget = getAuditTargets().find((target) => target.targetType === 'web');
  const classification = classifyTargetScope(webTarget, {
    inspectedLayers: ['config', 'toolchain', 'frontend']
  });

  const serverState = classification.layerStates.find((entry) => entry.layer === 'server');
  assert.equal(serverState.status, 'out_of_scope');
  assert.equal(classification.coverageStatus, 'blocked');
  assert.match(classification.blockedReason, /Partial layer coverage/i);
});

test('backend targets never require frontend layer inspection', () => {
  const backendTarget = getAuditTargets().find((target) => target.targetType === 'backend');
  const classification = classifyTargetScope(backendTarget, {
    inspectedLayers: ['config', 'toolchain', 'server', 'shared']
  });

  const frontendState = classification.layerStates.find((entry) => entry.layer === 'frontend');
  assert.equal(frontendState.status, 'out_of_scope');
});

test('shared-linked targets stay inside shared and integration by default', () => {
  const classification = classifyTargetScope({
    path: 'E:/repo/packages/shared',
    relativePath: 'packages/shared',
    targetType: 'shared-linked',
    expectedLayers: ['config', 'toolchain', 'shared', 'integration', 'security', 'performance', 'production']
  }, {
    inspectedLayers: ['config', 'shared', 'integration']
  });

  assert.equal(classification.layerStates.find((entry) => entry.layer === 'frontend').status, 'out_of_scope');
  assert.equal(classification.layerStates.find((entry) => entry.layer === 'server').status, 'out_of_scope');
  assert.ok(classification.inspectedLayers.includes('shared'));
});

test('powershell target scope classifier mirrors node layer rules', () => {
  const command = [
    `. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'common.ps1')}'`,
    `. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'audit-target-registry.ps1')}'`,
    `. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'target-scope-classifier.ps1')}'`,
    '$target = Get-AuditTargetRegistry | Where-Object { $_.targetType -eq \'web\' } | Select-Object -First 1',
    '$result = Classify-TargetScope -Target $target -InspectedLayers @(\'config\', \'toolchain\', \'frontend\')',
    '$result | ConvertTo-Json -Depth 8'
  ].join('; ');

  const output = execFileSync('pwsh', ['-NoLogo', '-Command', command], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const classification = JSON.parse(output);

  const serverState = classification.layerStates.find((entry) => entry.layer === 'server');
  assert.equal(serverState.status, 'out_of_scope');
  assert.equal(classification.coverageStatus, 'blocked');
});
