import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { createEvidenceRecord } from './evidence-schema.mjs';

const CHECK_SEQUENCE = [
  { name: 'lint', scripts: ['lint'] },
  { name: 'type-check', scripts: ['typecheck', 'type-check'] },
  { name: 'test', scripts: ['test'] },
  { name: 'build', scripts: ['build'] }
];

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function detectRunner(packageJson) {
  const packageManager = packageJson?.packageManager || '';
  if (packageManager.startsWith('pnpm')) return 'pnpm';
  if (packageManager.startsWith('yarn')) return 'yarn';
  if (packageManager.startsWith('bun')) return 'bun';
  return 'npm';
}

function resolveScriptName(scripts = {}, candidates = []) {
  return candidates.find((candidate) => scripts[candidate]) || null;
}

function executeScriptCommand(runner, scriptName, repoRoot, timeoutMs) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', `${runner} run ${scriptName}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: timeoutMs,
      env: process.env,
      windowsHide: true
    });
  }

  return spawnSync(runner, ['run', scriptName], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: process.env
  });
}

export function runAutomatedChecks(repoRoot, options = {}) {
  const packageJsonPath = join(repoRoot, 'package.json');
  const packageJson = existsSync(packageJsonPath) ? safeReadJson(packageJsonPath) : null;
  const scripts = packageJson?.scripts || {};
  const runner = detectRunner(packageJson);
  const timeoutMs = options.timeoutMs || 120000;
  const execute = options.execute !== false;

  const results = [];
  const evidence = [];

  for (const check of CHECK_SEQUENCE) {
    const scriptName = resolveScriptName(scripts, check.scripts);
    if (!scriptName) {
      const skipped = {
        name: check.name,
        script: null,
        status: 'unavailable',
        exit_code: null,
        stdout: '',
        stderr: '',
        command: null
      };
      results.push(skipped);
      evidence.push(createEvidenceRecord({
        id: `EV-CHECK-${String(results.length).padStart(3, '0')}`,
        source_type: 'command',
        location: packageJsonPath,
        command: `${runner} run ${check.scripts[0]}`,
        result: 'skipped',
        summary: `${check.name} script is unavailable at the repository root.`
      }));
      continue;
    }

    const command = `${runner} run ${scriptName}`;
    if (!execute) {
      const info = {
        name: check.name,
        script: scriptName,
        status: 'planned',
        exit_code: null,
        stdout: '',
        stderr: '',
        command
      };
      results.push(info);
      evidence.push(createEvidenceRecord({
        id: `EV-CHECK-${String(results.length).padStart(3, '0')}`,
        source_type: 'command',
        location: repoRoot,
        command,
        result: 'info',
        summary: `${check.name} command was planned but not executed.`
      }));
      continue;
    }

    const execution = executeScriptCommand(runner, scriptName, repoRoot, timeoutMs);

    const status = execution.error
      ? 'blocked'
      : execution.status === 0
        ? 'success'
        : 'failure';

    const result = {
      name: check.name,
      script: scriptName,
      status,
      exit_code: execution.status,
      stdout: execution.stdout || '',
      stderr: execution.stderr || (execution.error ? execution.error.message : ''),
      command
    };

    results.push(result);
    evidence.push(createEvidenceRecord({
      id: `EV-CHECK-${String(results.length).padStart(3, '0')}`,
      source_type: 'command',
      location: repoRoot,
      command,
      result: status === 'success' ? 'success' : status === 'blocked' ? 'blocked' : 'failure',
      summary: `${check.name} finished with status ${status}.`,
      details: [result.stdout, result.stderr].filter(Boolean).join('\n').slice(0, 4000)
    }));
  }

  return { results, evidence };
}
