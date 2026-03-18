import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

for (const fileName of readdirSync(join(repoRoot, 'commands')).filter((entry) => entry.endsWith('.md'))) {
  const content = read(join('commands', fileName));
  check(/^## Output\s*$/m.test(content), `Missing ## Output section in commands/${fileName}`);
}

const createFeatureContent = read('.Systematize/scripts/node/lib/create-feature.mjs');
check(
  !/execSync\s*\(\s*`[^`]*\$\{/.test(createFeatureContent),
  'Unsafe string interpolation remains in create-feature.mjs'
);

const cliContent = read('.Systematize/scripts/node/cli.mjs');
check(cliContent.includes('loadHooks('), 'Node CLI no longer loads hook definitions');
check(cliContent.includes('hook_executed'), 'Node CLI no longer records hook analytics');
check(cliContent.includes('custom_command_used'), 'Node CLI no longer records custom command usage');

const nodeAlertsContent = read('.Systematize/scripts/node/lib/check-alerts.mjs');
check(nodeAlertsContent.includes('getAlertsConfig'), 'Node alert checks no longer consume alerts.yml');

const psAlertsContent = read('.Systematize/scripts/powershell/check-alerts.ps1');
check(psAlertsContent.includes('Get-AlertsConfig'), 'PowerShell alert checks no longer consume alerts.yml');

const initNodeContent = read('.Systematize/scripts/node/lib/init-syskit.mjs');
check(initNodeContent.includes('features: {}'), 'Node init script no longer initializes analytics features as an object');
check(initNodeContent.includes('extensions: {}'), 'Node init script no longer initializes sync-state extensions');

const initPsContent = read('.Systematize/scripts/powershell/init-syskit.ps1');
check(initPsContent.includes('features = @{}'), 'PowerShell init script no longer initializes features as an object');
check(initPsContent.includes('extensions = @{'), 'PowerShell init script no longer initializes extensions metadata');

const recordAnalyticsPsContent = read('.Systematize/scripts/powershell/record-analytics.ps1');
check(recordAnalyticsPsContent.includes('custom_command_used'), 'PowerShell analytics script no longer supports custom command tracking');
check(recordAnalyticsPsContent.includes('hook_executed'), 'PowerShell analytics script no longer supports hook tracking');

check(
  existsSync(join(repoRoot, '.Systematize', 'templates', 'overrides', '.gitkeep')),
  'Missing .Systematize/templates/overrides/.gitkeep'
);

check(existsSync(join(repoRoot, 'polished-petting-curry.md')), 'Missing polished-petting-curry.md active plan file');

const analyticsPath = join(repoRoot, '.Systematize', 'memory', 'analytics.json');
if (existsSync(analyticsPath)) {
  const analytics = JSON.parse(readFileSync(analyticsPath, 'utf8'));
  check(analytics.features && !Array.isArray(analytics.features), 'analytics.json features must be an object');
  check(analytics.extensions && Array.isArray(analytics.extensions.hooks_executed), 'analytics.json missing hook execution tracking');
}

const syncStatePath = join(repoRoot, '.Systematize', 'memory', 'sync-state.json');
if (existsSync(syncStatePath)) {
  const syncState = JSON.parse(readFileSync(syncStatePath, 'utf8'));
  check(syncState.features && !Array.isArray(syncState.features), 'sync-state.json features must be an object');
  check(typeof syncState.extensions === 'object', 'sync-state.json missing extensions container');
}

if (failures.length > 0) {
  console.error('Contract verification failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Contract verification passed.');
