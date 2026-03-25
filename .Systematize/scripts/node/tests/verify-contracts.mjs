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

const commandCatalog = JSON.parse(read('.Systematize/config/command-catalog.json'));
const distributionContract = JSON.parse(read('.Systematize/config/distribution-manifest.json'));
const commandFiles = readdirSync(join(repoRoot, 'commands')).filter((entry) => entry.endsWith('.md'));
const normalizePath = (value) => value.replace(/\\/g, '/');
const catalogFiles = new Set(commandCatalog.commands.map((entry) => normalizePath(entry.file)));

check(commandCatalog.commands.length === commandFiles.length, 'Command catalog does not cover every governance command');
for (const fileName of commandFiles) {
  check(catalogFiles.has(normalizePath(join('commands', fileName))), `Missing command catalog entry for commands/${fileName}`);
}

for (const command of commandCatalog.commands) {
  const content = read(command.file);
  check(content.includes(`command_name: ${command.name}`), `Command metadata missing command_name in ${command.file}`);
  check(content.includes(`command_family: ${command.family}`), `Command metadata missing command_family in ${command.file}`);
  check(content.includes(`command_stage: ${command.stage}`), `Command metadata missing command_stage in ${command.file}`);
  check(
    content.includes(`command_requirement_level: ${command.requirement_level}`),
    `Command metadata missing requirement level in ${command.file}`
  );
  check(
    content.includes(`command_visibility: ${command.visibility}`),
    `Command metadata missing visibility in ${command.file}`
  );
  check(
    content.includes(`command_execution_mode: ${command.execution_mode}`),
    `Command metadata missing execution mode in ${command.file}`
  );
  check(
    content.includes(`runtime_command: ${command.runtime_command ?? 'null'}`),
    `Command metadata missing runtime command in ${command.file}`
  );
}

const runtimeMapContent = existsSync(join(repoRoot, 'docs', 'COMMAND_RUNTIME_MAP.md'))
  ? read('docs/COMMAND_RUNTIME_MAP.md')
  : '';
for (const command of commandCatalog.commands) {
  check(
    runtimeMapContent.includes(`| \`${command.name}\` |`),
    `Runtime map is missing command row for ${command.name}`
  );
  check(
    runtimeMapContent.includes(`| \`${command.name}\` | ${command.family} | ${command.stage} | ${command.requirement_level} | ${command.visibility} | ${command.execution_mode} |`),
    `Runtime map is missing visibility or execution metadata for ${command.name}`
  );
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

const powerShellWrapperFiles = [
  '.Systematize/scripts/powershell/auto-commit.ps1',
  '.Systematize/scripts/powershell/check-alerts.ps1',
  '.Systematize/scripts/powershell/get-feature-status.ps1',
  '.Systematize/scripts/powershell/run-healthcheck.ps1',
  '.Systematize/scripts/powershell/create-new-feature.ps1',
  '.Systematize/scripts/powershell/export-dashboard.ps1',
  '.Systematize/scripts/powershell/generate-pr.ps1',
  '.Systematize/scripts/powershell/setup-plan.ps1',
  '.Systematize/scripts/powershell/setup-research.ps1',
  '.Systematize/scripts/powershell/setup-tasks.ps1',
  '.Systematize/scripts/powershell/snapshot-artifacts.ps1',
  '.Systematize/scripts/powershell/check-prerequisites.ps1',
  '.Systematize/scripts/powershell/record-analytics.ps1',
  '.Systematize/scripts/powershell/update-sync-state.ps1',
  '.Systematize/scripts/powershell/generate-constitution.ps1',
  '.Systematize/scripts/powershell/update-agent-context.ps1',
  '.Systematize/scripts/powershell/init-syskit.ps1'
];

for (const relativePath of powerShellWrapperFiles) {
  check(read(relativePath).includes('Invoke-NodeSyskitCommand'), `PowerShell wrapper missing Node delegation: ${relativePath}`);
}

const initNodeContent = read('.Systematize/scripts/node/lib/init-syskit.mjs');
const initStateContent = read('.Systematize/scripts/node/lib/init-syskit-state.mjs');
check(initStateContent.includes('features: {}'), 'Node init state no longer initializes analytics features as an object');
check(initStateContent.includes('extensions: {}'), 'Node init state no longer initializes sync-state extensions');
check(initStateContent.includes('install-state.json'), 'Node init state no longer persists install-state.json');
check(initStateContent.includes('snapshot_path'), 'Node init state no longer reports snapshot_path');
check(initNodeContent.includes('resolveSelectedPlatforms'), 'Node init entry no longer delegates platform selection');

const initPsContent = read('.Systematize/scripts/powershell/init-syskit.ps1');
check(initPsContent.includes("Invoke-NodeSyskitCommand -CommandName 'init'"), 'PowerShell init wrapper no longer delegates to Node init');

const readmeContent = read('README.md');
check(readmeContent.includes('## السطح الأول'), 'Root README no longer exposes the generated primary surface');
check(readmeContent.includes('docs/START_HERE.md'), 'Root README no longer points to the official start-here document');
check(readmeContent.includes('/syskit.guide'), 'Root README no longer points to the official guidance entry');
check(readmeContent.includes('docs/REFERENCE.md'), 'Root README no longer points to the reference layer');
check(!readmeContent.includes('/syskit.quickstart'), 'Root README must not leak optional quickstart onto the primary surface');
check(existsSync(join(repoRoot, '.Systematize', 'scripts', 'hooks', 'pre-commit')), 'Missing tracked pre-commit hook source');
const preCommitContent = read('.Systematize/scripts/hooks/pre-commit');
check(preCommitContent.includes('npm run verify'), 'Pre-commit hook must run the full verify chain');
check(!preCommitContent.match(/npm run verify:docs\s*$/m), 'Pre-commit hook must not run verify:docs alone as the sole gate');
check(existsSync(join(repoRoot, '.Systematize', 'scripts', 'node', 'lib', 'setup-hooks.mjs')), 'Missing official hook setup script');
check(existsSync(join(repoRoot, '.Systematize', 'scripts', 'node', 'lib', 'clean-tracked-state.mjs')), 'Missing tracked clean tracked state helper');
check(existsSync(join(repoRoot, '.Systematize', 'scripts', 'node', 'lib', 'verify-clean-tree.mjs')), 'Missing official clean tracked state verification script');
check(existsSync(join(repoRoot, '.Systematize', 'scripts', 'node', 'tests', 'powershell-contracts.test.mjs')), 'Missing dedicated PowerShell contract suite');
check(existsSync(join(repoRoot, 'docs', 'START_HERE.md')), 'Missing start-here onboarding document');
check(existsSync(join(repoRoot, 'docs', 'REFERENCE.md')), 'Missing reference layer document');
check(existsSync(join(repoRoot, 'docs', 'OPTIONAL_CAPABILITIES.md')), 'Missing optional capabilities contract document');
check(existsSync(join(repoRoot, 'docs', 'PACKAGE_BOUNDARY.md')), 'Missing package boundary contract document');
check(existsSync(join(repoRoot, 'docs', 'DISTRIBUTION.md')), 'Missing distribution contract document');
check(existsSync(join(repoRoot, 'docs', 'policies', 'README.md')), 'Missing governance policy layer document');
check(existsSync(join(repoRoot, '.Systematize', 'extension-packages', 'README.md')), 'Missing extension package catalog document');
check(existsSync(join(repoRoot, '.Systematize', 'extension-packages', 'export', 'extension.json')), 'Missing export extension package');
check(existsSync(join(repoRoot, '.Systematize', 'extension-packages', 'analytics', 'extension.json')), 'Missing analytics extension package');
check(existsSync(join(repoRoot, '.Systematize', 'extension-packages', 'alerts', 'extension.json')), 'Missing alerts extension package');
check(existsSync(join(repoRoot, '.Systematize', 'extension-packages', 'taskstoissues', 'extension.json')), 'Missing taskstoissues extension package');

const startHereContent = existsSync(join(repoRoot, 'docs', 'START_HERE.md'))
  ? read('docs/START_HERE.md')
  : '';
check(startHereContent.includes('/syskit.guide'), 'Start-here document no longer points to /syskit.guide');
check(startHereContent.includes('/syskit.init'), 'Start-here document no longer covers /syskit.init');
check(startHereContent.includes('/syskit.systematize'), 'Start-here document no longer covers /syskit.systematize');
check(
  startHereContent.includes('| الأمر | متى أستخدمه؟ | الحالة |'),
  'Start-here document no longer contains the generated primary decision table'
);
check(startHereContent.includes('docs/REFERENCE.md'), 'Start-here document no longer points to the reference layer');
check(!startHereContent.includes('/syskit.quickstart'), 'Start-here document must not leak optional quickstart onto the primary surface');

const referenceLayerContent = existsSync(join(repoRoot, 'docs', 'REFERENCE.md'))
  ? read('docs/REFERENCE.md')
  : '';
for (const referencePath of [
  'docs/ARCHITECTURE.md',
  'docs/PACKAGE_BOUNDARY.md',
  'docs/OPTIONAL_CAPABILITIES.md',
  'docs/DISTRIBUTION.md',
  'docs/policies/README.md'
]) {
  check(referenceLayerContent.includes(referencePath), `Reference layer no longer links to ${referencePath}`);
}

for (const referenceDoc of [
  'docs/ARCHITECTURE.md',
  'docs/PACKAGE_BOUNDARY.md',
  'docs/OPTIONAL_CAPABILITIES.md',
  'docs/DISTRIBUTION.md',
  'docs/policies/README.md'
]) {
  check(read(referenceDoc).includes('docs/START_HERE.md'), `Reference document no longer points back to docs/START_HERE.md: ${referenceDoc}`);
}

const extractedPolicyMap = {
  'commands/syskit.systematize.md': 'docs/policies/systematize-policy.md',
  'commands/syskit.research.md': 'docs/policies/research-policy.md',
  'commands/syskit.tasks.md': 'docs/policies/tasks-policy.md',
  'commands/syskit.analyze.md': 'docs/policies/analyze-policy.md',
  'commands/syskit.checklist.md': 'docs/policies/checklist-policy.md',
  'commands/syskit.implement.md': 'docs/policies/implement-policy.md',
  'commands/syskit.clarify.md': 'docs/policies/clarify-policy.md'
};

for (const [commandPath, policyPath] of Object.entries(extractedPolicyMap)) {
  check(existsSync(join(repoRoot, policyPath)), `Missing extracted policy file: ${policyPath}`);
  check(read(commandPath).includes(policyPath), `Command does not reference extracted policy: ${commandPath}`);
}

const syskitConfigContent = read('.Systematize/config/syskit-config.yml');
check(syskitConfigContent.includes('export_enabled:'), 'Root syskit config is missing export capability toggle');
check(syskitConfigContent.includes('taskstoissues_enabled:'), 'Root syskit config is missing taskstoissues capability toggle');
const rootPackageContent = read('package.json');
check(rootPackageContent.includes('"package:dist"'), 'Root package.json is missing the distribution packaging script');
check(rootPackageContent.includes('"verify:clean-tree": "node .Systematize/scripts/node/lib/verify-clean-tree.mjs"'), 'Root package.json is missing the clean tracked state verification script');
check(rootPackageContent.includes('"verify:language": "node .Systematize/scripts/node/lib/verify-governing-language.mjs"'), 'Root package.json is missing the governing language verification script');
check(rootPackageContent.includes('"test:powershell": "node --test .Systematize/scripts/node/tests/powershell-contracts.test.mjs"'), 'Root package.json is missing the dedicated PowerShell contract suite');
check(rootPackageContent.includes('"setup:hooks": "node .Systematize/scripts/node/lib/setup-hooks.mjs"'), 'Root package.json is missing the official hook setup script');
check(rootPackageContent.includes('"prepare": "npm run setup:hooks"'), 'Root package.json is missing automatic hook installation during package setup');
check(
  rootPackageContent.includes('"verify": "npm run test && npm run verify:docs && npm run verify:language && npm run verify:contracts"'),
  'Root verify script no longer remains a check-only verification flow'
);

check(
  Array.isArray(distributionContract.repo_generated_paths) && distributionContract.repo_generated_paths.length > 0,
  'Distribution contract is missing repository generated paths'
);
check(
  JSON.stringify(distributionContract.repo_generated_paths) === JSON.stringify([
    'commands',
    'README.md',
    'docs/START_HERE.md',
    'docs/REFERENCE.md',
    'docs/COMMAND_RUNTIME_MAP.md',
    'docs/_project_tree.json'
  ]),
  'Distribution contract repository generated paths no longer match the official generated delivery surface'
);

const distributionDocContent = read('docs/DISTRIBUTION.md');
check(
  distributionDocContent.includes('يرفض المتابعة فورًا'),
  'Distribution documentation no longer states that delivery refuses generated-repository drift'
);
check(
  distributionDocContent.includes('npm run verify:clean-tree'),
  'Distribution documentation no longer documents the official clean tracked state proof step'
);
check(
  distributionDocContent.includes('npm run test:powershell'),
  'Distribution documentation no longer documents the dedicated PowerShell contract suite'
);
check(
  distributionDocContent.includes('npm run package:dist'),
  'Distribution documentation no longer documents the official distribution command'
);
check(
  distributionDocContent.includes('.Systematize/scripts/hooks/pre-commit'),
  'Distribution documentation no longer documents the tracked local pre-commit hook'
);
check(
  distributionDocContent.includes('npm run setup:hooks'),
  'Distribution documentation no longer documents manual hook installation'
);
check(
  distributionDocContent.includes('windows-latest'),
  'Distribution documentation no longer documents the Windows proof environment'
);
check(
  distributionDocContent.includes('ubuntu-latest'),
  'Distribution documentation no longer documents the Linux proof environment'
);
check(
  distributionDocContent.includes('على هدف نظيف داخل اختبارات التسليم'),
  'Distribution documentation no longer states that generated installers are re-verified against a fresh target'
);

const buildDistributionContent = read('.Systematize/scripts/node/lib/build-distribution.mjs');
check(
  buildDistributionContent.includes('repo_generated_paths'),
  'build-distribution no longer enforces repository generated paths from the distribution contract'
);
check(
  buildDistributionContent.includes('Distribution build refused to continue because prebuild generators changed tracked generated repository files.'),
  'build-distribution no longer fails explicitly when prebuild generation changes tracked repository files'
);
check(
  buildDistributionContent.includes('Distribution build tracked state'),
  'build-distribution no longer asserts clean tracked state after packaging'
);

const ciWorkflowContent = read('.github/workflows/ci.yml');
check(
  ciWorkflowContent.includes('npm run package:dist'),
  'CI no longer proves the official distribution path'
);
check(
  ciWorkflowContent.includes('matrix:'),
  'CI no longer declares a cross-environment verification matrix'
);
check(
  ciWorkflowContent.includes('fail-fast: false'),
  'CI no longer forces every environment in the verification matrix to report independently'
);
check(
  ciWorkflowContent.includes('windows-latest'),
  'CI no longer proves the official flow on Windows'
);
check(
  ciWorkflowContent.includes('ubuntu-latest'),
  'CI no longer proves the official flow on Linux'
);
check(
  ciWorkflowContent.includes('npm run verify:clean-tree'),
  'CI no longer proves that tracked files stay clean after packaging through the official verification script'
);
check(
  (ciWorkflowContent.match(/npm run verify/g) || []).length >= 2,
  'CI no longer verifies both before and after the official distribution path'
);
check(
  ciWorkflowContent.includes('npm run test:powershell'),
  'CI no longer runs the dedicated PowerShell contract suite'
);
check(
  ciWorkflowContent.includes('shell: pwsh'),
  'CI no longer exercises the PowerShell compatibility shell inside the official proof path'
);

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
  /SPECS_DIR/
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
check(planContent.includes('FEATURES_DIR'), 'Plan command no longer uses the features workspace contract');
check(!planContent.includes('Execute Phase 0: Research'), 'Plan command still executes research implicitly');
check(planContent.includes('If `research.md` is missing or incomplete, fail and direct the user to `/syskit.research`.'), 'Plan command no longer enforces the mandatory research gate');

const quickstartContent = read('commands/syskit.quickstart.md');
check(!quickstartContent.includes('Generate `plan.md`'), 'Quickstart still generates plan.md');
check(quickstartContent.includes('/syskit.constitution'), 'Quickstart no longer hands off to /syskit.constitution');
check(quickstartContent.includes('/syskit.research'), 'Quickstart no longer hands off to /syskit.research');
check(quickstartContent.includes('المسار السريع'), 'Quickstart command no longer presents itself as the quick path');

const guideContent = read('commands/syskit.guide.md');
check(guideContent.includes('المدخل التوجيهي الرسمي'), 'Guide command no longer presents itself as the official guidance entry');
check(guideContent.includes('ليس طبقة حوكمة جديدة'), 'Guide command no longer states that it is not a new governance layer');
check(guideContent.includes('ليس محرك قرار مستقل'), 'Guide command no longer states that it is not an independent decision engine');
check(guideContent.includes('لا يكتب حالة جديدة'), 'Guide command no longer states that it does not write new state');
check(guideContent.includes('لا يغير العقود'), 'Guide command no longer states that it does not change contracts');

const initCommandContent = read('commands/syskit.init.md');
check(initCommandContent.includes('التهيئة الأولى'), 'Init command no longer presents itself as the first-time initialization path');

const systematizeCommandContent = read('commands/syskit.systematize.md');
check(systematizeCommandContent.includes('المسار الكامل'), 'Systematize command no longer presents itself as the default full path');

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

const healthContent = read('.Systematize/scripts/node/lib/health.mjs');
check(healthContent.includes("scope: 'heuristic'"), 'health.mjs must declare heuristic scope in its return value');
check(healthContent.includes('ADVISORY_PASS'), 'health.mjs must use advisory status labels, not authoritative ones');
check(!healthContent.match(/status:.*'HEALTHY'/), 'health.mjs must not return HEALTHY as an authoritative verdict');

const healthcheckCommandContent = read('commands/syskit.healthcheck.md');
check(healthcheckCommandContent.includes('advisory'), 'Healthcheck command must declare advisory scope in its description');
check(healthcheckCommandContent.includes('npm run verify'), 'Healthcheck command must reference the authoritative verify chain');

const governingDocs = [
  'README.md',
  'docs/START_HERE.md',
  'docs/ARCHITECTURE.md',
  'docs/DISTRIBUTION.md',
  'docs/REFERENCE.md',
  'docs/OPTIONAL_CAPABILITIES.md',
  'docs/PACKAGE_BOUNDARY.md',
  'docs/policies/README.md'
];
const arabicSectionPattern = /^##\s+[\u0600-\u06FF]/m;
for (const docPath of governingDocs) {
  const docContent = read(docPath);
  check(
    arabicSectionPattern.test(docContent),
    `Governing document ${docPath} must use Arabic section headings for language consistency`
  );
}

if (failures.length > 0) {
  console.error('Contract verification failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Contract verification passed.');
