import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

test('node cli help exposes the production command surface', () => {
  const output = execFileSync(
    'node',
    ['.Systematize/scripts/node/cli.mjs', '--help'],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  assert.match(output, /Systematize KIT CLI/);
  assert.match(output, /generate-constitution/);
  assert.match(output, /update-agent-context/);
  assert.match(output, /setup-tasks/);
  assert.doesNotMatch(output, /"recorded":\s*true/);
});

test('powershell production scripts expose help without crashing', () => {
  const scripts = [
    '.Systematize/scripts/powershell/check-alerts.ps1',
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
