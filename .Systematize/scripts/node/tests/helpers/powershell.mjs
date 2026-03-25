import { spawnSync } from 'node:child_process';

let cachedResult;

export function hasPowerShell() {
  if (cachedResult !== undefined) return cachedResult;

  const result = spawnSync(
    'pwsh',
    ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'],
    { encoding: 'utf8', stdio: 'pipe' }
  );

  cachedResult = result.status === 0;
  return cachedResult;
}
