import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeRepoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function createTempRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'syskit-extension-test-'));
  mkdirSync(join(repoRoot, '.Systematize', 'config'), { recursive: true });
  mkdirSync(join(repoRoot, '.Systematize', 'extensions', 'commands'), { recursive: true });
  mkdirSync(join(repoRoot, '.Systematize', 'extensions', 'templates'), { recursive: true });
  mkdirSync(join(repoRoot, '.Systematize', 'extension-packages', 'export'), { recursive: true });
  return repoRoot;
}

test('installs and removes packaged extensions through the runtime cli', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'extension-packages', 'export', 'extension.json'),
      JSON.stringify({
        schema_version: 1,
        name: 'export',
        capability: 'export',
        install_by_default: false,
        runtime_flags: ['export_enabled'],
        runtime_commands: ['export-dashboard']
      }, null, 2),
      'utf8'
    );

    const beforeList = JSON.parse(execFileSync(
      'node',
      [join(runtimeRepoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'list-extensions', '--json'],
      { cwd: repoRoot, encoding: 'utf8' }
    ));
    assert.equal(beforeList.extensions.length, 1);
    assert.equal(beforeList.extensions[0].installed, false);

    const installResult = JSON.parse(execFileSync(
      'node',
      [join(runtimeRepoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'install-extension', 'export', '--json'],
      { cwd: repoRoot, encoding: 'utf8' }
    ));
    assert.equal(installResult.installed, true);
    assert.equal(existsSync(join(repoRoot, '.Systematize', 'extensions', 'export', 'extension.json')), true);

    const afterInstallList = JSON.parse(execFileSync(
      'node',
      [join(runtimeRepoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'list-extensions', '--json'],
      { cwd: repoRoot, encoding: 'utf8' }
    ));
    assert.equal(afterInstallList.extensions[0].installed, true);

    const removeResult = JSON.parse(execFileSync(
      'node',
      [join(runtimeRepoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs'), 'remove-extension', 'export', '--json'],
      { cwd: repoRoot, encoding: 'utf8' }
    ));
    assert.equal(removeResult.removed, true);
    assert.equal(existsSync(join(repoRoot, '.Systematize', 'extensions', 'export')), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
