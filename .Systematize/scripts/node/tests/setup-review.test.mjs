import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const cliPath = join(repoRoot, '.Systematize', 'scripts', 'node', 'cli.mjs');

function createTempRepo() {
  const tempRepo = join(tmpdir(), `syskit-review-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const featureDir = join(tempRepo, 'features', '001-clean-review');

  mkdirSync(join(tempRepo, '.Systematize', 'templates'), { recursive: true });
  mkdirSync(featureDir, { recursive: true });
  mkdirSync(join(tempRepo, 'apps', 'api', 'chatbot'), { recursive: true });
  mkdirSync(join(tempRepo, 'apps', 'web', 'components'), { recursive: true });
  mkdirSync(join(tempRepo, 'packages', 'shared'), { recursive: true });

  writeFileSync(join(tempRepo, '.Systematize', 'templates', 'review-template.md'), '# Review Template\n', 'utf8');
  writeFileSync(join(featureDir, 'sys.md'), '# Sys\n', 'utf8');
  writeFileSync(join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
  writeFileSync(join(featureDir, 'tasks.md'), '# Tasks\n', 'utf8');

  writeFileSync(join(tempRepo, 'package.json'), JSON.stringify({
    name: 'review-fixture',
    scripts: {
      lint: 'node -e ""',
      'type-check': 'node -e ""',
      test: 'node -e ""',
      build: 'node -e ""'
    },
    dependencies: {
      zod: '^4.0.0',
      pino: '^9.0.0'
    }
  }, null, 2), 'utf8');

  writeFileSync(join(tempRepo, 'apps', 'api', 'chatbot', 'route.ts'), [
    "import { z } from 'zod';",
    '',
    'const schema = z.object({ id: z.string() });',
    '',
    'export async function POST(request) {',
    '  try {',
    '    const payload = schema.parse(await request.json());',
    '    return { ok: true, payload };',
    '  } catch (error) {',
    '    return { ok: false, error };',
    '  }',
    '}'
  ].join('\n'), 'utf8');

  writeFileSync(join(tempRepo, 'packages', 'shared', 'service.ts'), [
    'export function normalizeValue(value: string) {',
    '  return value.trim();',
    '}'
  ].join('\n'), 'utf8');

  writeFileSync(join(tempRepo, 'apps', 'web', 'components', 'dashboard.tsx'), [
    "import { useEffect, useState } from 'react';",
    '',
    'export function Dashboard() {',
    '  const [loading, setLoading] = useState(true);',
    '  const [error, setError] = useState(null);',
    '',
    '  useEffect(() => {',
    '    fetch("/api/status")',
    '      .then((response) => {',
    '        if (!response.ok) throw new Error("request failed");',
    '        return response.json();',
    '      })',
    '      .catch(setError)',
    '      .finally(() => setLoading(false));',
    '  }, []);',
    '',
    '  return loading ? error : null;',
    '}'
  ].join('\n'), 'utf8');

  return { tempRepo, featureDir };
}

test('setup-review generates the strict executive report without placeholders', () => {
  const { tempRepo, featureDir } = createTempRepo();

  try {
    const output = execFileSync(
      'node',
      [cliPath, 'setup-review', '--json', '--branch', '001-clean-review'],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    const reviewPath = join(featureDir, 'review.md');
    const reviewContent = readFileSync(reviewPath, 'utf8');

    assert.equal(result.validation.status, 'accepted');
    assert.match(reviewContent, /## Executive Summary/);
    assert.match(reviewContent, /## Critical Issues Table/);
    assert.match(reviewContent, /## Layer-by-Layer Findings/);
    assert.match(reviewContent, /\*\*Verdict\*\*:/);
    assert.equal(/\[[A-Z_]{3,}(?::[^\]]+)?\]/.test(reviewContent), false);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test('setup-review validate-existing accepts the generated executive report', () => {
  const { tempRepo } = createTempRepo();

  try {
    execFileSync(
      'node',
      [cliPath, 'setup-review', '--json', '--branch', '001-clean-review'],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const output = execFileSync(
      'node',
      [cliPath, 'setup-review', '--validate-existing', '--json', '--branch', '001-clean-review'],
      { cwd: tempRepo, encoding: 'utf8' }
    );

    const result = JSON.parse(output);
    assert.equal(result.validation.status, 'accepted');
    assert.match(result.review_verdict, /APPROVED|CHANGES REQUIRED/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
