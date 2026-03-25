import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeRepoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function createTempRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'syskit-capability-test-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot, stdio: 'pipe' });
  mkdirSync(join(repoRoot, '.Systematize', 'config'), { recursive: true });
  return repoRoot;
}

test('export capability can be disabled without creating export artifacts', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'),
      `schema_version: 1
version: "2.0"
export_enabled: false
analytics_enabled: false
alerts_enabled: false
`,
      'utf8'
    );

    mkdirSync(join(repoRoot, 'features', '001-demo-flow'), { recursive: true });

    const output = execFileSync(
      'node',
      [join(runtimeRepoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'export-dashboard', '--json', '--branch', '001-demo-flow'],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    assert.equal(result.disabled, true);
    assert.equal(result.capability, 'export');
    assert.equal(result.outputPath, null);
    assert.equal(existsSync(join(repoRoot, '.Systematize', 'exports')), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
