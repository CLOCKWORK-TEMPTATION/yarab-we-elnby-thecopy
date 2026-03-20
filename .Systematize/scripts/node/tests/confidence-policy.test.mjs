import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { buildConfidenceStatement } from '../lib/confidence-policy.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

test('confidence policy returns high confidence for full coverage and full execution', () => {
  const statement = buildConfidenceStatement({
    checkResults: [
      { checkName: 'lint', status: 'executed' },
      { checkName: 'type-check', status: 'executed' },
      { checkName: 'test', status: 'executed' },
      { checkName: 'build', status: 'executed' }
    ],
    targets: [
      { relativePath: 'apps/web/src/app/(main)/brainstorm', coverageStatus: 'inspected' },
      { relativePath: 'apps/backend/src/services', coverageStatus: 'inspected' }
    ]
  });

  assert.equal(statement.reviewMode, 'Full Execution Review');
  assert.equal(statement.confidenceLevel, 'High');
});

test('confidence policy downgrades confidence for missing environment blockers', () => {
  const statement = buildConfidenceStatement({
    checkResults: [
      { checkName: 'lint', status: 'executed' },
      { checkName: 'type-check', status: 'blocked', directCause: 'Missing env file.' },
      { checkName: 'test', status: 'blocked', directCause: 'Missing env file.' },
      { checkName: 'build', status: 'blocked', directCause: 'Missing env file.' }
    ],
    targets: [
      { relativePath: 'apps/web/src/app/(main)/brainstorm', coverageStatus: 'blocked', blockedReason: 'Missing env file.' }
    ],
    environmentBlockers: ['NEXTAUTH_SECRET is missing']
  });

  assert.equal(statement.reviewMode, 'Partial Execution Review');
  assert.equal(statement.confidenceLevel, 'Low');
  assert.match(statement.confidenceRationale, /Environment blockers/i);
});

test('confidence policy treats partial coverage as medium confidence floor', () => {
  const statement = buildConfidenceStatement({
    checkResults: [
      { checkName: 'lint', status: 'executed', scope: 'web', directCause: 'partial web scope', confidenceImpact: 'medium' },
      { checkName: 'type-check', status: 'executed' },
      { checkName: 'test', status: 'executed' },
      { checkName: 'build', status: 'executed' }
    ],
    targets: [
      { relativePath: 'apps/web/src/app/(main)/brainstorm', coverageStatus: 'inspected', blockedReason: 'partial coverage' }
    ]
  });

  assert.equal(statement.reviewMode, 'Partial Execution Review');
  assert.equal(statement.confidenceLevel, 'Medium');
  assert.ok(statement.uncoveredAreas.some((entry) => entry.includes('partial coverage')));
});

test('powershell confidence policy matches node confidence policy semantics', () => {
  const command = `
. '${join(repoRoot, '.Systematize', 'scripts', 'powershell', 'confidence-policy.ps1')}'
$params = @{
  CheckResults = @(
    [pscustomobject]@{ checkName = 'lint'; status = 'executed' },
    [pscustomobject]@{ checkName = 'type-check'; status = 'executed' },
    [pscustomobject]@{ checkName = 'test'; status = 'executed' },
    [pscustomobject]@{ checkName = 'build'; status = 'executed' }
  )
  Targets = @(
    [pscustomobject]@{ relativePath = 'apps/web/src/app/(main)/brainstorm'; coverageStatus = 'inspected' },
    [pscustomobject]@{ relativePath = 'apps/backend/src/services'; coverageStatus = 'inspected' }
  )
}
$statement = Get-ConfidenceStatement @params
$statement | ConvertTo-Json -Depth 6
`;

  const output = execFileSync('pwsh', ['-NoLogo', '-Command', command], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const statement = JSON.parse(output);

  assert.equal(statement.reviewMode, 'Full Execution Review');
  assert.equal(statement.confidenceLevel, 'High');
});
