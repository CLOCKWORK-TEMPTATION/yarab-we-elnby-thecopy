import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { findUnresolvedPlaceholders, parseArgs, ensureDir } from './common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function replaceAll(content, replacements) {
  let output = content;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
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

    if (existsSync(targetPath) && !force) {
      summary.skipped.push(targetPath);
      continue;
    }

    ensureDir(dirname(targetPath));
    copyFileSync(sourcePath, targetPath);
    summary.written.push(targetPath);
  }
}

function writeIfNeeded(targetPath, content, force, summary) {
  if (existsSync(targetPath) && !force) {
    summary.skipped.push(targetPath);
    return;
  }

  ensureDir(dirname(targetPath));
  writeFileSync(targetPath, content, 'utf8');
  summary.written.push(targetPath);
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
  summary.written.push(targetPath);
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

  let content = replaceAll(templateContent, {
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
  const placeholders = findUnresolvedPlaceholders(content).filter((item) => !['[PROJECT_NAME]'].includes(item));
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
  let constitutionContent = existsSync(constitutionTemplatePath)
    ? readFileSync(constitutionTemplatePath, 'utf8')
    : '# دستور المشروع [PROJECT_NAME]\n';

  constitutionContent = replaceAll(constitutionContent, {
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

function groupPlatformOutputs(platforms) {
  const grouped = new Map();
  for (const platform of platforms) {
    for (const outputFile of platform.output_files || []) {
      if (!grouped.has(outputFile)) grouped.set(outputFile, []);
      grouped.get(outputFile).push(platform.display_name);
    }
  }
  return grouped;
}

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit init [OPTIONS]\n\nOPTIONS:\n  --target-path <path>   Target repository path (default: current working directory)\n  --platforms <list>     Comma-separated platform keys to initialize (default: all)\n  --force                Overwrite existing managed files\n  --json                 Output JSON summary\n  --help                 Show help`);
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
    ? String(opts.platforms).split(',').map(item => item.trim()).filter(Boolean)
    : allPlatforms.map(item => item.key);

  const unknownKeys = requestedKeys.filter(key => !allPlatforms.some(item => item.key === key));
  if (unknownKeys.length > 0) {
    console.error(`Unknown platform keys: ${unknownKeys.join(', ')}`);
    process.exit(1);
  }

  const selectedPlatforms = allPlatforms.filter(item => requestedKeys.includes(item.key));
  const summary = { target_root: targetRoot, written: [], skipped: [], platforms: selectedPlatforms.map(item => item.key) };

  ensureDir(targetRoot);

  copyManagedTree(join(sourceRoot, 'commands'), join(targetRoot, 'commands'), opts.force, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'config'), join(targetRoot, '.Systematize', 'config'), opts.force, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'templates'), join(targetRoot, '.Systematize', 'templates'), opts.force, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'scripts'), join(targetRoot, '.Systematize', 'scripts'), opts.force, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'presets'), join(targetRoot, '.Systematize', 'presets'), opts.force, summary);

  const extensionsReadme = join(sourceRoot, '.Systematize', 'extensions', 'README.md');
  if (existsSync(extensionsReadme)) {
    writeIfNeeded(join(targetRoot, '.Systematize', 'extensions', 'README.md'), readFileSync(extensionsReadme, 'utf8'), opts.force, summary);
  }

  initializeDirectories(targetRoot);
  initializeExtensions(targetRoot, opts.force, summary);
  initializeMemory(sourceRoot, targetRoot, projectName, opts.force, summary);

  const templatePath = join(sourceRoot, '.Systematize', 'templates', 'agent-file-template.md');
  const templateContent = existsSync(templatePath)
    ? readFileSync(templatePath, 'utf8')
    : '# [PROJECT NAME] Development Guidelines\n\nAuto-generated from all feature plans. Last updated: [DATE]\n\n## Active Technologies\n\n[EXTRACTED FROM ALL PLAN.MD FILES]\n\n## Project Structure\n\n```text\n[ACTUAL STRUCTURE FROM PLANS]\n```\n\n## Commands\n\n[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]\n\n## Code Style\n\n[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]\n\n## Recent Changes\n\n[LAST 3 FEATURES AND WHAT THEY ADDED]\n\n<!-- MANUAL ADDITIONS START -->\n<!-- MANUAL ADDITIONS END -->\n';

  const groupedOutputs = groupPlatformOutputs(selectedPlatforms);
  const dateText = new Date().toISOString().slice(0, 10);

  for (const [relativePath, platformsForFile] of groupedOutputs.entries()) {
    const absolutePath = join(targetRoot, relativePath);

    if (relativePath === '.gitignore') {
      appendGitIgnore(absolutePath, opts.force, summary);
      continue;
    }

    if (relativePath === '.vscode/tasks.json') {
      writeIfNeeded(absolutePath, renderVsCodeTasks(), opts.force, summary);
      continue;
    }

    if (relativePath === '.vscode/settings.json') {
      writeIfNeeded(absolutePath, renderVsCodeSettings(), opts.force, summary);
      continue;
    }

    if (relativePath === '.vscode/extensions.json') {
      writeIfNeeded(absolutePath, renderVsCodeExtensions(), opts.force, summary);
      continue;
    }

    const markdownContent = renderAgentGuidance(templateContent, projectName, platformsForFile, dateText);
    const fileContent = absolutePath.endsWith('.mdc') ? renderMdcGuidance(markdownContent) : markdownContent;
    assertNoRuntimePlaceholders(fileContent, absolutePath);
    writeIfNeeded(absolutePath, fileContent, opts.force, summary);
  }

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Initialized Systematize KIT in: ${targetRoot}`);
    console.log(`Platforms: ${summary.platforms.join(', ')}`);
    console.log(`Written: ${summary.written.length}`);
    console.log(`Skipped: ${summary.skipped.length}`);
  }
}
