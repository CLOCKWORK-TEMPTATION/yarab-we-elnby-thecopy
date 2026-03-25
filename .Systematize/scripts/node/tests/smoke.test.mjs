import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hasPowerShell } from './helpers/powershell.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const powerShellAvailable = hasPowerShell();

test('node cli help exposes the production command surface', () => {
  const output = execFileSync(
    'node',
    ['.Systematize/scripts/node/cli.mjs', '--help'],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  assert.match(output, /Systematize Framework Runtime CLI/);
  assert.match(output, /generate-constitution/);
  assert.match(output, /update-agent-context/);
  assert.match(output, /setup-tasks/);
  assert.match(output, /list-extensions/);
  assert.match(output, /install-extension/);
  assert.match(output, /build-distribution/);
  assert.match(output, /v2\.0/);
  assert.doesNotMatch(output, /"recorded":\s*true/);
});

test('powershell production scripts expose help without crashing', { skip: !powerShellAvailable }, () => {
  const scripts = [
    '.Systematize/scripts/powershell/check-alerts.ps1',
    '.Systematize/scripts/powershell/create-new-feature.ps1',
    '.Systematize/scripts/powershell/export-dashboard.ps1',
    '.Systematize/scripts/powershell/generate-pr.ps1',
    '.Systematize/scripts/powershell/snapshot-artifacts.ps1',
    '.Systematize/scripts/powershell/update-agent-context.ps1',
    '.Systematize/scripts/powershell/setup-plan.ps1',
    '.Systematize/scripts/powershell/setup-research.ps1',
    '.Systematize/scripts/powershell/setup-tasks.ps1'
  ];

  for (const scriptPath of scripts) {
    const output = execFileSync(
      'pwsh',
      ['-File', scriptPath, '-Help'],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    assert.match(output, /Usage:/);
  }
});
