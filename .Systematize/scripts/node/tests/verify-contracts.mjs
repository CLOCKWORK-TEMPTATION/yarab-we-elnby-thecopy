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

function collectMarkdownAndScriptFiles(relativeDir) {
  const absoluteDir = join(repoRoot, relativeDir);
  const files = [];
  const nodeTestsRoot = join('.Systematize', 'scripts', 'node', 'tests');

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (relativePath === nodeTestsRoot) continue;
      files.push(...collectMarkdownAndScriptFiles(relativePath));
      continue;
    }

    if (/\.(md|mjs|ps1)$/i.test(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
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
check(initNodeContent.includes('install-state.json'), 'Node init script no longer persists install-state.json');
check(initNodeContent.includes('snapshot_path'), 'Node init script no longer reports snapshot_path');

const initPsContent = read('.Systematize/scripts/powershell/init-syskit.ps1');
check(initPsContent.includes('features = @{}'), 'PowerShell init script no longer initializes features as an object');
check(initPsContent.includes('extensions = @{'), 'PowerShell init script no longer initializes extensions metadata');
check(initPsContent.includes('install-state.json'), 'PowerShell init script no longer persists install-state.json');
check(initPsContent.includes('snapshot_path'), 'PowerShell init script no longer reports snapshot_path');

const workflowManagedFiles = [
  ...collectMarkdownAndScriptFiles('commands'),
  ...collectMarkdownAndScriptFiles('.Systematize/templates'),
  ...collectMarkdownAndScriptFiles('.Systematize/scripts'),
  '.Systematize/presets/api-service/templates/sys-template.md'
];
const bannedLegacyWorkflowPatterns = [
  /\bspec\b/i,
  /\bspecs\b/i,
  /Specification/,
  /Specifications/,
  /docs\(specs\)/,
  /SPECS_DIR/,
  /Get-AllFeatureDirs/,
  /getAllFeatureDirs/
];

for (const relativePath of [...new Set(workflowManagedFiles)]) {
  const content = read(relativePath);
  for (const pattern of bannedLegacyWorkflowPatterns) {
    check(!pattern.test(content), `Legacy workflow wording remains in ${relativePath}: ${pattern}`);
  }
}

const clarifyContent = read('commands/syskit.clarify.md');
check(
  clarifyContent.includes('/syskit.constitution'),
  'Clarify command no longer points to /syskit.constitution as the next mandatory gate'
);
check(
  !clarifyContent.includes('not ready for `/syskit.plan`'),
  'Clarify command still suggests /syskit.plan directly'
);

const planContent = read('commands/syskit.plan.md');
check(planContent.includes('AMINOOOF_DIR'), 'Plan command no longer uses the aminooof workspace contract');
check(!planContent.includes('Execute Phase 0: Research'), 'Plan command still executes research implicitly');
check(planContent.includes('If `research.md` is missing or incomplete, fail and direct the user to `/syskit.research`.'), 'Plan command no longer enforces the mandatory research gate');

const quickstartContent = read('commands/syskit.quickstart.md');
check(!quickstartContent.includes('Generate `plan.md`'), 'Quickstart still generates plan.md');
check(quickstartContent.includes('/syskit.constitution'), 'Quickstart no longer hands off to /syskit.constitution');
check(quickstartContent.includes('/syskit.research'), 'Quickstart no longer hands off to /syskit.research');

const recordAnalyticsPsContent = read('.Systematize/scripts/powershell/record-analytics.ps1');
check(recordAnalyticsPsContent.includes('custom_command_used'), 'PowerShell analytics script no longer supports custom command tracking');
check(recordAnalyticsPsContent.includes('hook_executed'), 'PowerShell analytics script no longer supports hook tracking');

const reviewTemplateContent = read('.Systematize/templates/review-template.md');
for (const requiredHeading of [
  '## Executive Summary',
  '## Critical Issues Table',
  '## Layer-by-Layer Findings',
  '## Confidence and Coverage',
  '## Repair Priority Map',
  '## Action Plan'
]) {
  check(reviewTemplateContent.includes(requiredHeading), `Review template missing required heading: ${requiredHeading}`);
}
for (const forbiddenLegacyHeading of [
  '## sys.md (PRD) Review',
  '## plan.md Review',
  '## tasks.md Review',
  '## Cross-Artifact Consistency',
  '## Review Verdict'
]) {
  check(!reviewTemplateContent.includes(forbiddenLegacyHeading), `Legacy review heading remains in review-template.md: ${forbiddenLegacyHeading}`);
}

const auditCommandContent = read('commands/syskit.audit.md');
check(auditCommandContent.includes('audit-target-registry.mjs'), 'Audit command no longer loads the official audit target registry');
check(auditCommandContent.includes('target-scope-classifier.mjs'), 'Audit command no longer references the scope classifier contract');
check(auditCommandContent.includes('audit-report-builder.mjs'), 'Audit command no longer references the executive audit report builder');
check(auditCommandContent.includes('Static Analysis Only'), 'Audit command no longer defines the static-only review mode');
check(auditCommandContent.includes('Partial Execution Review'), 'Audit command no longer defines the partial execution review mode');
check(auditCommandContent.includes('Full Execution Review'), 'Audit command no longer defines the full execution review mode');
check(auditCommandContent.includes('{FEATURE_DIR}/audit.md'), 'Audit command no longer writes the standalone audit artifact');
check(
  !auditCommandContent.includes('Save the final report to `{FEATURE_DIR}/review.md`'),
  'Audit command must not save the audit artifact into review.md'
);
check(
  !auditCommandContent.includes('**Files created or updated**: `{FEATURE_DIR}/review.md`'),
  'Audit command output contract must not target review.md'
);
for (const requiredAuditHeading of [
  '## Executive Summary',
  '## Critical Issues Table',
  '## Layer-by-Layer Findings',
  '## Confidence and Coverage',
  '## Repair Priority Map',
  '## Action Plan'
]) {
  check(auditCommandContent.includes(requiredAuditHeading), `Audit command no longer enforces the report heading: ${requiredAuditHeading}`);
}

for (const requiredFeatureContract of [
  'aminooof/002-audit-platform-apps/contracts/confidence-policy-contract.md',
  'aminooof/002-audit-platform-apps/contracts/heterogeneous-scope-rules.md',
  'aminooof/002-audit-platform-apps/contracts/layer-review-rubric.md'
]) {
  check(existsSync(join(repoRoot, requiredFeatureContract)), `Missing feature contract: ${requiredFeatureContract}`);
}

const confidenceContractContent = read('aminooof/002-audit-platform-apps/contracts/confidence-policy-contract.md');
check(confidenceContractContent.includes('Static Analysis Only'), 'Confidence policy contract missing Static Analysis Only mode');
check(confidenceContractContent.includes('Partial Execution Review'), 'Confidence policy contract missing Partial Execution Review mode');
check(confidenceContractContent.includes('Full Execution Review'), 'Confidence policy contract missing Full Execution Review mode');

const scopeRulesContent = read('aminooof/002-audit-platform-apps/contracts/heterogeneous-scope-rules.md');
check(scopeRulesContent.includes('out_of_scope'), 'Heterogeneous scope rules no longer define out_of_scope handling');
check(scopeRulesContent.includes('mergedFrom'), 'Heterogeneous scope rules no longer enforce mergedFrom root-cause merging');

check(
  existsSync(join(repoRoot, '.Systematize', 'templates', 'overrides', '.gitkeep')),
  'Missing .Systematize/templates/overrides/.gitkeep'
);

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
