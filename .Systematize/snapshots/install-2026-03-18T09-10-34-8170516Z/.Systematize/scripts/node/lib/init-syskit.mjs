import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline/promises';
import process from 'process';
import {
  ensureDir,
  findUnresolvedPlaceholders,
  getSyskitConfig,
  parseArgs,
  readJsonFile,
  writeJsonFile
} from './common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INSTALL_STATE_RELATIVE_PATH = join('.Systematize', 'memory', 'install-state.json');
const CORE_INSTALL_MARKERS = [
  join('commands', 'syskit.init.md'),
  join('.Systematize', 'config', 'syskit-config.yml'),
  join('.Systematize', 'templates', 'agent-file-template.md'),
  join('.Systematize', 'scripts', 'powershell', 'init-syskit.ps1'),
  join('.Systematize', 'scripts', 'node', 'cli.mjs')
];
const MANAGED_CORE_DIRECTORIES = [
  'commands',
  join('.Systematize', 'config'),
  join('.Systematize', 'templates'),
  join('.Systematize', 'scripts'),
  join('.Systematize', 'presets')
];
const MANAGED_DYNAMIC_FILES = [
  join('.Systematize', 'extensions', 'README.md'),
  join('.Systematize', 'extensions', 'commands', '.gitkeep'),
  join('.Systematize', 'extensions', 'templates', '.gitkeep'),
  join('.Systematize', 'memory', 'analytics.json'),
  join('.Systematize', 'memory', 'sync-state.json'),
  join('.Systematize', 'memory', 'constitution.md'),
  INSTALL_STATE_RELATIVE_PATH
];

function replaceAll(content, replacements) {
  let output = content;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
}

function trackWrite(summary, targetPath, existedBefore) {
  summary.written.push(targetPath);

  if (existedBefore) {
    summary.overwritten_paths.push(targetPath);
  } else {
    summary.created_paths.push(targetPath);
  }
}

function copyManagedTree(sourceDir, targetDir, force, summary) {
  if (!existsSync(sourceDir)) return;
  if (resolve(sourceDir) === resolve(targetDir)) return;

  ensureDir(targetDir);

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyManagedTree(sourcePath, targetPath, force, summary);
      continue;
    }

    const existedBefore = existsSync(targetPath);
    if (existedBefore && !force) {
      summary.skipped.push(targetPath);
      continue;
    }

    ensureDir(dirname(targetPath));
    copyFileSync(sourcePath, targetPath);
    trackWrite(summary, targetPath, existedBefore);
  }
}

function writeIfNeeded(targetPath, content, force, summary) {
  const existedBefore = existsSync(targetPath);
  if (existedBefore && !force) {
    summary.skipped.push(targetPath);
    return;
  }

  ensureDir(dirname(targetPath));
  writeFileSync(targetPath, content, 'utf8');
  trackWrite(summary, targetPath, existedBefore);
}

function appendGitIgnore(targetPath, force, summary) {
  const block = [
    '# Systematize KIT',
    '.Systematize/exports/',
    '.Systematize/snapshots/',
    ''
  ].join('\n');

  if (!existsSync(targetPath)) {
    writeIfNeeded(targetPath, block, force, summary);
    return;
  }

  const current = readFileSync(targetPath, 'utf8');
  if (current.includes('# Systematize KIT')) {
    summary.skipped.push(targetPath);
    return;
  }

  const next = `${current.replace(/\s*$/, '')}\n\n${block}`;
  writeFileSync(targetPath, next, 'utf8');
  trackWrite(summary, targetPath, true);
}

function renderAgentGuidance(templateContent, projectName, supportedPlatforms, dateText) {
  const commands = [
    'PowerShell:',
    'pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json',
    '',
    'Node.js:',
    'node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json',
    '',
    'Bootstrap:',
    'pwsh -File .Systematize/scripts/powershell/init-syskit.ps1',
    'node .Systematize/scripts/node/cli.mjs init'
  ].join('\n');

  const style = [
    'Follow repository conventions and update these instructions after plan.md is created.',
    'Prefer the Systematize workflow: sys -> clarify -> constitution -> research -> plan -> tasks -> implement.'
  ].join('\n');

  const content = replaceAll(templateContent, {
    '[PROJECT NAME]': projectName,
    '[DATE]': dateText,
    '[EXTRACTED FROM ALL PLAN.MD FILES]': '- Bootstrap stage: no plan-derived technologies yet',
    '[ACTUAL STRUCTURE FROM PLANS]': 'commands/\n.Systematize/\nspecs/',
    '[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]': commands,
    '[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]': style,
    '[LAST 3 FEATURES AND WHAT THEY ADDED]': '- bootstrap: Installed Systematize KIT'
  });

  const lines = content.split('\n');
  lines.splice(3, 0, `Supported platforms: ${supportedPlatforms.join(', ')}`, '');
  return lines.join('\n');
}

function renderMdcGuidance(markdownContent) {
  const frontmatter = [
    '---',
    'description: Project Development Guidelines',
    'globs: ["**/*"]',
    'alwaysApply: true',
    '---',
    ''
  ].join('\n');

  return `${frontmatter}${markdownContent}`;
}

function assertNoRuntimePlaceholders(content, targetPath) {
  const placeholders = findUnresolvedPlaceholders(content).filter((item) => item !== '[PROJECT_NAME]');
  if (placeholders.length > 0) {
    throw new Error(`Unresolved placeholders in ${targetPath}: ${placeholders.join(', ')}`);
  }
}

function renderVsCodeTasks() {
  return JSON.stringify({
    version: '2.0.0',
    tasks: [
      {
        label: 'Syskit: Create Feature (PowerShell)',
        type: 'shell',
        command: 'pwsh',
        args: ['-File', '.Systematize/scripts/powershell/create-new-feature.ps1', 'Feature description', '-Json'],
        problemMatcher: []
      },
      {
        label: 'Syskit: Healthcheck (PowerShell)',
        type: 'shell',
        command: 'pwsh',
        args: ['-File', '.Systematize/scripts/powershell/run-healthcheck.ps1'],
        problemMatcher: []
      },
      {
        label: 'Syskit: Status (Node)',
        type: 'shell',
        command: 'node',
        args: ['.Systematize/scripts/node/cli.mjs', 'feature-status', '--json'],
        problemMatcher: []
      }
    ]
  }, null, 2);
}

function renderVsCodeSettings() {
  return JSON.stringify({
    'files.exclude': {
      '**/.Systematize/exports': true,
      '**/.Systematize/snapshots': true
    },
    'search.exclude': {
      '**/.Systematize/exports': true,
      '**/.Systematize/snapshots': true
    }
  }, null, 2);
}

function renderVsCodeExtensions() {
  return JSON.stringify({
    recommendations: [
      'github.copilot',
      'Continue.continue'
    ]
  }, null, 2);
}

function initializeMemory(sourceRoot, targetRoot, projectName, force, summary) {
  const memoryDir = join(targetRoot, '.Systematize', 'memory');
  ensureDir(memoryDir);

  writeIfNeeded(
    join(memoryDir, 'analytics.json'),
    JSON.stringify({
      schema_version: 1,
      features: {},
      extensions: {
        hooks_executed: [],
        custom_commands_used: []
      }
    }, null, 2),
    force,
    summary
  );
  writeIfNeeded(
    join(memoryDir, 'sync-state.json'),
    JSON.stringify({
      schema_version: 1,
      features: {},
      extensions: {},
      last_global_check: null
    }, null, 2),
    force,
    summary
  );

  const dateText = new Date().toISOString().slice(0, 10);
  const constitutionTemplatePath = join(sourceRoot, '.Systematize', 'templates', 'constitution-template.md');
  const template = existsSync(constitutionTemplatePath)
    ? readFileSync(constitutionTemplatePath, 'utf8')
    : '# دستور المشروع [PROJECT_NAME]\n';

  const constitutionContent = replaceAll(template, {
    '[PROJECT_NAME]': projectName,
    '[CONSTITUTION_VERSION]': '1.0.0',
    '[CONSTITUTION_DATE]': dateText,
    '[LAST_AMENDED_DATE]': dateText
  });

  writeIfNeeded(join(memoryDir, 'constitution.md'), constitutionContent, force, summary);
}

function initializeExtensions(targetRoot, force, summary) {
  const base = join(targetRoot, '.Systematize', 'extensions');
  ensureDir(join(base, 'commands'));
  ensureDir(join(base, 'templates'));
  writeIfNeeded(join(base, 'commands', '.gitkeep'), '', force, summary);
  writeIfNeeded(join(base, 'templates', '.gitkeep'), '', force, summary);
}

function initializeDirectories(targetRoot) {
  const dirs = [
    join(targetRoot, '.Systematize', 'exports'),
    join(targetRoot, '.Systematize', 'snapshots'),
    join(targetRoot, 'specs')
  ];

  for (const dirPath of dirs) ensureDir(dirPath);
}

function collectRelativeFiles(baseDir, currentDir = baseDir) {
  if (!existsSync(currentDir)) return [];

  const files = [];
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRelativeFiles(baseDir, entryPath));
      continue;
    }

    files.push(relative(baseDir, entryPath));
  }

  return files;
}

function getManagedCoreRelativeFiles(sourceRoot) {
  const relativeFiles = [];

  for (const relativeDir of MANAGED_CORE_DIRECTORIES) {
    const absoluteDir = join(sourceRoot, relativeDir);
    relativeFiles.push(...collectRelativeFiles(sourceRoot, absoluteDir));
  }

  for (const relativeFile of MANAGED_DYNAMIC_FILES) {
    if (relativeFile === INSTALL_STATE_RELATIVE_PATH) {
      relativeFiles.push(relativeFile);
      continue;
    }

    if (existsSync(join(sourceRoot, relativeFile))) {
      relativeFiles.push(relativeFile);
    }
  }

  return [...new Set(relativeFiles)];
}

function expandPlatformOutputTargets(platform) {
  const targets = [];
  const seen = new Set();
  const mirrorDirectories = Array.isArray(platform.mirror_directories) ? platform.mirror_directories.filter(Boolean) : [];

  for (const outputFile of platform.output_files || []) {
    if (!seen.has(outputFile)) {
      seen.add(outputFile);
      targets.push(outputFile);
    }

    if (outputFile.includes('/') || outputFile.includes('\\')) continue;

    for (const mirrorDirectory of mirrorDirectories) {
      const mirrorPath = join(mirrorDirectory, outputFile);
      if (seen.has(mirrorPath)) continue;
      seen.add(mirrorPath);
      targets.push(mirrorPath);
    }
  }

  return targets;
}

function buildPlatformStatus(platform, targetRoot) {
  const outputs = expandPlatformOutputTargets(platform);
  const existingOutputs = outputs.filter((item) => existsSync(join(targetRoot, item)));
  let status = 'غير موجود';
  if (existingOutputs.length > 0 && existingOutputs.length < outputs.length) status = 'موجود جزئيًا';
  if (existingOutputs.length > 0 && existingOutputs.length === outputs.length) status = 'موجود بالكامل';

  return {
    ...platform,
    managed_outputs: outputs,
    existing_outputs: existingOutputs,
    status
  };
}

function detectInstallation(targetRoot) {
  const installStatePath = join(targetRoot, INSTALL_STATE_RELATIVE_PATH);
  const state = readJsonFile(installStatePath);
  if (state) {
    return {
      detected: true,
      mode: 'state',
      state,
      markers_found: CORE_INSTALL_MARKERS.filter((item) => existsSync(join(targetRoot, item)))
    };
  }

  const markersFound = CORE_INSTALL_MARKERS.filter((item) => existsSync(join(targetRoot, item)));
  return {
    detected: markersFound.length >= 3,
    mode: markersFound.length >= 3 ? 'legacy' : 'none',
    state: null,
    markers_found: markersFound
  };
}

function isInteractiveSession(jsonMode) {
  return !jsonMode && process.stdin.isTTY && process.stdout.isTTY;
}

function isAffirmativeAnswer(answer) {
  const normalized = String(answer || '').trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'ok', 'okay', 'نعم', 'ايوه', 'أيوه', 'اه', 'موافق'].includes(normalized);
}

async function resolveReinstallDecision({ detection, force, interactive }) {
  if (!detection.detected) {
    return {
      approved: true,
      reinstall_performed: false,
      overwrite_mode: force ? 'force_initial' : 'initial_install'
    };
  }

  if (force) {
    return {
      approved: true,
      reinstall_performed: true,
      overwrite_mode: 'force'
    };
  }

  if (!interactive) {
    return {
      approved: true,
      reinstall_performed: true,
      overwrite_mode: 'non_interactive'
    };
  }

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await prompt.question(
      'تم اكتشاف أن Systematize KIT مثبتة مسبقًا. إعادة التثبيت ستنشئ نسخة احتياطية ثم تعيد كتابة الملفات المُدارة للمنصات التي ستختارها. هل تريد المتابعة؟ [y/N]: '
    );

    return {
      approved: isAffirmativeAnswer(answer),
      reinstall_performed: isAffirmativeAnswer(answer),
      overwrite_mode: isAffirmativeAnswer(answer) ? 'confirmed' : 'cancelled'
    };
  } finally {
    prompt.close();
  }
}

function parsePlatformSelectionAnswer(answer, platformStatuses) {
  const trimmed = String(answer || '').trim();
  if (!trimmed || ['all', '*', 'الكل', 'كلها'].includes(trimmed.toLowerCase())) {
    return platformStatuses.map((item) => item.key);
  }

  const tokens = trimmed.split(/[,\s]+/).filter(Boolean);
  const byIndex = new Map(platformStatuses.map((item, index) => [String(index + 1), item.key]));
  const availableKeys = new Set(platformStatuses.map((item) => item.key));
  const selectedKeys = [];

  for (const token of tokens) {
    if (byIndex.has(token)) {
      selectedKeys.push(byIndex.get(token));
      continue;
    }

    if (availableKeys.has(token)) {
      selectedKeys.push(token);
      continue;
    }

    return null;
  }

  if (selectedKeys.length === 0) return null;
  return platformStatuses.filter((item) => selectedKeys.includes(item.key)).map((item) => item.key);
}

async function resolveSelectedPlatforms({ allPlatforms, requestedKeys, targetRoot, interactive, shouldPrompt }) {
  const explicitSelection = Array.isArray(requestedKeys) && requestedKeys.length > 0;
  if (explicitSelection) {
    return allPlatforms.filter((item) => requestedKeys.includes(item.key));
  }

  if (!shouldPrompt || !interactive) {
    return allPlatforms;
  }

  const platformStatuses = allPlatforms.map((item) => buildPlatformStatus(item, targetRoot));
  console.log('اختر المنصات التي تريد أن تعيد المنظومة إنشاء ملفاتها ومجلداتها الآن:');
  for (const [index, platform] of platformStatuses.entries()) {
    console.log(`[${index + 1}] ${platform.key} — ${platform.display_name} — الحالة: ${platform.status}`);
    console.log(`    المخرجات: ${platform.managed_outputs.join(', ')}`);
  }
  console.log('اضغط Enter لاختيار كل المنصات، أو اكتب الأرقام أو المفاتيح مفصولة بفواصل.');

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    while (true) {
      const answer = await prompt.question('اختيار المنصات: ');
      const selectedKeys = parsePlatformSelectionAnswer(answer, platformStatuses);
      if (selectedKeys) {
        return allPlatforms.filter((item) => selectedKeys.includes(item.key));
      }

      console.log('الاختيار غير صالح. استخدم أرقام القائمة أو مفاتيح المنصات كما هي.');
    }
  } finally {
    prompt.close();
  }
}

function buildPlatformOutputMap(platforms) {
  const grouped = new Map();

  for (const platform of platforms) {
    for (const outputFile of expandPlatformOutputTargets(platform)) {
      if (!grouped.has(outputFile)) grouped.set(outputFile, []);
      const labels = grouped.get(outputFile);
      if (!labels.includes(platform.display_name)) labels.push(platform.display_name);
    }
  }

  return grouped;
}

function createInstallSnapshot(sourceRoot, targetRoot, selectedPlatforms) {
  const relativePaths = [
    ...getManagedCoreRelativeFiles(sourceRoot),
    ...selectedPlatforms.flatMap((item) => expandPlatformOutputTargets(item))
  ];

  const existingPaths = [...new Set(relativePaths)].filter((item) => existsSync(join(targetRoot, item)));
  if (existingPaths.length === 0) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotRoot = join(targetRoot, '.Systematize', 'snapshots', `install-${timestamp}`);
  ensureDir(snapshotRoot);

  for (const relativePath of existingPaths) {
    const sourcePath = join(targetRoot, relativePath);
    const snapshotPath = join(snapshotRoot, relativePath);
    ensureDir(dirname(snapshotPath));
    copyFileSync(sourcePath, snapshotPath);
  }

  writeJsonFile(join(snapshotRoot, 'manifest.json'), {
    schema_version: 1,
    created_at: new Date().toISOString(),
    files: existingPaths
  });

  return snapshotRoot;
}

function writeInstallState({ sourceRoot, targetRoot, selectedPlatforms, summary, detection }) {
  const runtimeConfig = getSyskitConfig(sourceRoot) || {};
  const installStatePath = join(targetRoot, INSTALL_STATE_RELATIVE_PATH);
  const managedOutputs = [...new Set(selectedPlatforms.flatMap((item) => expandPlatformOutputTargets(item)))];

  writeJsonFile(installStatePath, {
    schema_version: 1,
    syskit_version: runtimeConfig.version || 'unknown',
    installed_at: new Date().toISOString(),
    install_mode: summary.reinstall_performed ? 'reinstall' : 'initial_install',
    overwrite_mode: summary.overwrite_mode,
    detection_mode: detection.mode,
    selected_platforms: summary.selected_platforms,
    managed_outputs: managedOutputs,
    created_paths: summary.created_paths.map((item) => relative(targetRoot, item)),
    overwritten_paths: summary.overwritten_paths.map((item) => relative(targetRoot, item)),
    snapshot_path: summary.snapshot_path ? relative(targetRoot, summary.snapshot_path) : null
  });
}

function buildSummaryBase(targetRoot, detection) {
  return {
    target_root: targetRoot,
    installation_detected: detection.detected,
    detection_mode: detection.mode,
    reinstall_performed: false,
    overwrite_mode: 'initial_install',
    selected_platforms: [],
    written: [],
    skipped: [],
    created_paths: [],
    overwritten_paths: [],
    created_count: 0,
    overwritten_count: 0,
    snapshot_path: null,
    install_state_path: join(targetRoot, INSTALL_STATE_RELATIVE_PATH),
    cancelled: false
  };
}

function printSummary(summary) {
  console.log(`Initialized Systematize KIT in: ${summary.target_root}`);
  console.log(`Installation detected: ${summary.installation_detected ? 'yes' : 'no'}`);
  console.log(`Reinstall performed: ${summary.reinstall_performed ? 'yes' : 'no'}`);
  console.log(`Overwrite mode: ${summary.overwrite_mode}`);
  console.log(`Selected platforms: ${summary.selected_platforms.join(', ')}`);
  console.log(`Created: ${summary.created_count}`);
  console.log(`Overwritten: ${summary.overwritten_count}`);
  console.log(`Skipped: ${summary.skipped.length}`);
  if (summary.snapshot_path) {
    console.log(`Snapshot: ${summary.snapshot_path}`);
  }
  if (summary.cancelled) {
    console.log('Installation cancelled by user.');
  }
}

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit init [OPTIONS]

OPTIONS:
  --target-path <path>   Target repository path (default: current working directory)
  --platforms <list>     Comma-separated platform keys to initialize
  --force                Bypass reinstall warning and rewrite managed files
  --json                 Output JSON summary
  --help                 Show help`);
    return;
  }

  const sourceRoot = resolve(__dirname, '../../../..');
  const targetRoot = resolve(opts['target-path'] || process.cwd());
  const projectName = basename(targetRoot);
  const catalogPath = join(sourceRoot, '.Systematize', 'config', 'platform-catalog.json');

  if (!existsSync(catalogPath)) {
    console.error(`Platform catalog not found: ${catalogPath}`);
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const allPlatforms = catalog.platforms || [];
  const requestedKeys = opts.platforms
    ? String(opts.platforms).split(',').map((item) => item.trim()).filter(Boolean)
    : null;

  if (requestedKeys) {
    const unknownKeys = requestedKeys.filter((key) => !allPlatforms.some((item) => item.key === key));
    if (unknownKeys.length > 0) {
      console.error(`Unknown platform keys: ${unknownKeys.join(', ')}`);
      process.exit(1);
    }
  }

  const detection = detectInstallation(targetRoot);
  const summary = buildSummaryBase(targetRoot, detection);
  const interactive = isInteractiveSession(opts.json);
  const reinstallDecision = await resolveReinstallDecision({
    detection,
    force: opts.force === true,
    interactive
  });

  summary.reinstall_performed = reinstallDecision.reinstall_performed;
  summary.overwrite_mode = reinstallDecision.overwrite_mode;

  if (!reinstallDecision.approved) {
    summary.cancelled = true;
    if (opts.json) console.log(JSON.stringify(summary, null, 2));
    else printSummary(summary);
    return;
  }

  const selectedPlatforms = await resolveSelectedPlatforms({
    allPlatforms,
    requestedKeys,
    targetRoot,
    interactive,
    shouldPrompt: detection.detected
  });

  summary.selected_platforms = selectedPlatforms.map((item) => item.key);

  if (detection.detected && reinstallDecision.reinstall_performed) {
    summary.snapshot_path = createInstallSnapshot(sourceRoot, targetRoot, selectedPlatforms);
  }

  const effectiveForce = opts.force === true || reinstallDecision.reinstall_performed;

  ensureDir(targetRoot);

  copyManagedTree(join(sourceRoot, 'commands'), join(targetRoot, 'commands'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'config'), join(targetRoot, '.Systematize', 'config'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'templates'), join(targetRoot, '.Systematize', 'templates'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'scripts'), join(targetRoot, '.Systematize', 'scripts'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'presets'), join(targetRoot, '.Systematize', 'presets'), effectiveForce, summary);

  const extensionsReadme = join(sourceRoot, '.Systematize', 'extensions', 'README.md');
  if (existsSync(extensionsReadme)) {
    writeIfNeeded(
      join(targetRoot, '.Systematize', 'extensions', 'README.md'),
      readFileSync(extensionsReadme, 'utf8'),
      effectiveForce,
      summary
    );
  }

  initializeDirectories(targetRoot);
  initializeExtensions(targetRoot, effectiveForce, summary);
  initializeMemory(sourceRoot, targetRoot, projectName, effectiveForce, summary);

  const templatePath = join(sourceRoot, '.Systematize', 'templates', 'agent-file-template.md');
  const templateContent = existsSync(templatePath)
    ? readFileSync(templatePath, 'utf8')
    : '# [PROJECT NAME] Development Guidelines\n\nAuto-generated from all feature plans. Last updated: [DATE]\n\n## Active Technologies\n\n[EXTRACTED FROM ALL PLAN.MD FILES]\n\n## Project Structure\n\n```text\n[ACTUAL STRUCTURE FROM PLANS]\n```\n\n## Commands\n\n[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]\n\n## Code Style\n\n[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]\n\n## Recent Changes\n\n[LAST 3 FEATURES AND WHAT THEY ADDED]\n\n<!-- MANUAL ADDITIONS START -->\n<!-- MANUAL ADDITIONS END -->\n';

  const groupedOutputs = buildPlatformOutputMap(selectedPlatforms);
  const dateText = new Date().toISOString().slice(0, 10);

  for (const [relativePath, platformsForFile] of groupedOutputs.entries()) {
    const absolutePath = join(targetRoot, relativePath);

    if (relativePath === '.gitignore') {
      appendGitIgnore(absolutePath, effectiveForce, summary);
      continue;
    }

    if (relativePath === '.vscode/tasks.json') {
      writeIfNeeded(absolutePath, renderVsCodeTasks(), effectiveForce, summary);
      continue;
    }

    if (relativePath === '.vscode/settings.json') {
      writeIfNeeded(absolutePath, renderVsCodeSettings(), effectiveForce, summary);
      continue;
    }

    if (relativePath === '.vscode/extensions.json') {
      writeIfNeeded(absolutePath, renderVsCodeExtensions(), effectiveForce, summary);
      continue;
    }

    const markdownContent = renderAgentGuidance(templateContent, projectName, platformsForFile, dateText);
    const fileContent = absolutePath.endsWith('.mdc') ? renderMdcGuidance(markdownContent) : markdownContent;
    assertNoRuntimePlaceholders(fileContent, absolutePath);
    writeIfNeeded(absolutePath, fileContent, effectiveForce, summary);
  }

  summary.created_count = summary.created_paths.length;
  summary.overwritten_count = summary.overwritten_paths.length;
  writeInstallState({
    sourceRoot,
    targetRoot,
    selectedPlatforms,
    summary,
    detection
  });

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printSummary(summary);
  }
}

export {
  buildPlatformOutputMap,
  buildPlatformStatus,
  detectInstallation,
  expandPlatformOutputTargets,
  isAffirmativeAnswer,
  parsePlatformSelectionAnswer
};
