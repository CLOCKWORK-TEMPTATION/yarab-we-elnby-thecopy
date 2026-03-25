import { copyFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { ensureDir, getFeatureWorkspaceRoot, getSyskitConfig, readJsonFile, writeJsonFile } from './common.mjs';
import { collectRelativeFiles, copyManagedTree, writeIfNeeded } from './init-syskit-files.mjs';
import { expandPlatformOutputTargets, getPlatformBundleRelativeFiles } from './init-syskit-platforms.mjs';
import { replaceAll } from './init-syskit-render.mjs';

export const INSTALL_STATE_RELATIVE_PATH = join('.Systematize', 'memory', 'install-state.json');
export const CORE_INSTALL_MARKERS = [
  join('commands', 'syskit.init.md'),
  join('.Systematize', 'config', 'syskit-config.yml'),
  join('.Systematize', 'templates', 'agent-file-template.md'),
  join('.Systematize', 'scripts', 'powershell', 'init-syskit.ps1'),
  join('.Systematize', 'scripts', 'node', 'cli.mjs')
];
export const MANAGED_CORE_DIRECTORIES = [
  'commands',
  join('.Systematize', 'config'),
  join('.Systematize', 'extension-packages'),
  join('.Systematize', 'templates'),
  join('.Systematize', 'scripts'),
  join('.Systematize', 'presets')
];
export const MANAGED_DYNAMIC_FILES = [
  join('.Systematize', 'extensions', 'README.md'),
  join('.Systematize', 'extensions', 'commands', '.gitkeep'),
  join('.Systematize', 'extensions', 'templates', '.gitkeep'),
  join('.Systematize', 'memory', 'analytics.json'),
  join('.Systematize', 'memory', 'sync-state.json'),
  join('.Systematize', 'memory', 'constitution.md'),
  INSTALL_STATE_RELATIVE_PATH
];

export function initializeMemory(sourceRoot, targetRoot, projectName, force, summary) {
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

export function initializeExtensions(targetRoot, force, summary) {
  const base = join(targetRoot, '.Systematize', 'extensions');
  ensureDir(join(base, 'commands'));
  ensureDir(join(base, 'templates'));
  writeIfNeeded(join(base, 'commands', '.gitkeep'), '', force, summary);
  writeIfNeeded(join(base, 'templates', '.gitkeep'), '', force, summary);

  const catalogRoot = join(targetRoot, '.Systematize', 'extension-packages');
  if (!existsSync(catalogRoot)) return;

  for (const entry of readdirSync(catalogRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const packageRoot = join(catalogRoot, entry.name);
    const manifestPath = join(packageRoot, 'extension.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.install_by_default !== true) continue;

      copyManagedTree(packageRoot, join(base, entry.name), force, summary);
    } catch {
      // Ignore malformed package manifests during initialization.
    }
  }
}

export function initializeDirectories(targetRoot) {
  const workflowRoot = getFeatureWorkspaceRoot(targetRoot, { mutating: true, ensureExists: true });
  const dirs = [
    join(targetRoot, '.Systematize', 'exports'),
    join(targetRoot, '.Systematize', 'snapshots'),
    workflowRoot
  ];

  for (const dirPath of dirs) ensureDir(dirPath);
}

export function getManagedCoreRelativeFiles(sourceRoot) {
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

export function detectInstallation(targetRoot) {
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

export function createInstallSnapshot(sourceRoot, targetRoot, selectedPlatforms) {
  const relativePaths = [
    ...getManagedCoreRelativeFiles(sourceRoot),
    ...getPlatformBundleRelativeFiles(sourceRoot, selectedPlatforms),
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

export function writeInstallState({ sourceRoot, targetRoot, selectedPlatforms, summary, detection }) {
  const runtimeConfig = getSyskitConfig(sourceRoot) || {};
  const installStatePath = join(targetRoot, INSTALL_STATE_RELATIVE_PATH);
  const managedOutputs = [
    ...new Set([
      ...selectedPlatforms.flatMap((item) => expandPlatformOutputTargets(item)),
      ...getPlatformBundleRelativeFiles(sourceRoot, selectedPlatforms)
    ])
  ];

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

export function buildSummaryBase(targetRoot, detection) {
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
    cancelled: false,
    project_name: basename(targetRoot)
  };
}

export function printSummary(summary) {
  console.log(`Initialized Systematize Framework in: ${summary.target_root}`);
  console.log(`Reinstall: ${summary.reinstall_performed ? 'yes' : 'no'}`);
  console.log(`Platforms selected: ${summary.selected_platforms.length}`);
  console.log(`Created: ${summary.created_count} | Overwritten: ${summary.overwritten_count} | Skipped: ${summary.skipped.length}`);
  if (summary.snapshot_path) {
    console.log(`Snapshot: ${summary.snapshot_path}`);
  }
  if (summary.cancelled) {
    console.log('Installation cancelled by user.');
  }
}
