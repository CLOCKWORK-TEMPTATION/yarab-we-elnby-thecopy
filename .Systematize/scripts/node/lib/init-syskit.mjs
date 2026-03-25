import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ensureDir, parseArgs } from './common.mjs';
import { appendGitIgnore, copyManagedTree, writeIfNeeded } from './init-syskit-files.mjs';
import {
  assertNoRuntimePlaceholders,
  renderAgentGuidance,
  renderMdcGuidance,
  renderVsCodeExtensions,
  renderVsCodeSettings,
  renderVsCodeTasks
} from './init-syskit-render.mjs';
import {
  applyPlatformSelectionKey,
  buildPlatformOutputMap,
  buildPlatformStatus,
  copyPlatformBundles,
  createPlatformSelectionState,
  expandPlatformOutputTargets,
  getPlatformSelectionView,
  isAffirmativeAnswer,
  isInteractiveSession,
  parsePlatformSelectionCommand,
  resolveReinstallDecision,
  resolveSelectedPlatforms,
  sortPlatformStatuses,
  translatePlatformStatusForPrompt
} from './init-syskit-platforms.mjs';
import {
  buildSummaryBase,
  createInstallSnapshot,
  detectInstallation,
  initializeDirectories,
  initializeExtensions,
  initializeMemory,
  printSummary,
  writeInstallState
} from './init-syskit-state.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const supportsPrompting = isInteractiveSession(opts.json);
  const supportsRawMenu = supportsPrompting && process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
  const reinstallDecision = await resolveReinstallDecision({
    detection,
    force: opts.force === true,
    interactive: supportsPrompting
  });

  summary.reinstall_performed = reinstallDecision.reinstall_performed;
  summary.overwrite_mode = reinstallDecision.overwrite_mode;

  if (!reinstallDecision.approved) {
    summary.cancelled = true;
    if (opts.json) console.log(JSON.stringify(summary, null, 2));
    else printSummary(summary);
    return;
  }

  let selectedPlatforms;

  try {
    selectedPlatforms = await resolveSelectedPlatforms({
      allPlatforms,
      requestedKeys,
      targetRoot,
      supportsPrompting,
      supportsRawMenu,
      shouldPrompt: detection.detected
    });
  } catch (error) {
    if (error.message === 'Platform selection cancelled by user.') {
      summary.cancelled = true;
      if (opts.json) console.log(JSON.stringify(summary, null, 2));
      else printSummary(summary);
      return;
    }

    throw error;
  }

  summary.selected_platforms = selectedPlatforms.map((item) => item.key);

  if (detection.detected && reinstallDecision.reinstall_performed) {
    summary.snapshot_path = createInstallSnapshot(sourceRoot, targetRoot, selectedPlatforms);
  }

  const effectiveForce = opts.force === true || reinstallDecision.reinstall_performed;

  ensureDir(targetRoot);
  copyManagedTree(join(sourceRoot, 'commands'), join(targetRoot, 'commands'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'config'), join(targetRoot, '.Systematize', 'config'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'extension-packages'), join(targetRoot, '.Systematize', 'extension-packages'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'templates'), join(targetRoot, '.Systematize', 'templates'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'scripts'), join(targetRoot, '.Systematize', 'scripts'), effectiveForce, summary);
  copyManagedTree(join(sourceRoot, '.Systematize', 'presets'), join(targetRoot, '.Systematize', 'presets'), effectiveForce, summary);
  copyPlatformBundles(sourceRoot, targetRoot, selectedPlatforms, effectiveForce, summary);

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
  applyPlatformSelectionKey,
  buildPlatformOutputMap,
  buildPlatformStatus,
  createPlatformSelectionState,
  detectInstallation,
  expandPlatformOutputTargets,
  getPlatformSelectionView,
  isAffirmativeAnswer,
  parsePlatformSelectionCommand,
  sortPlatformStatuses,
  translatePlatformStatusForPrompt
};
