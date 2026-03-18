import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline/promises';
import { emitKeypressEvents } from 'readline';
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
const PLATFORM_BUNDLE_DIRECTORIES = [
  { sourceSegments: ['commands'], targetName: 'commands' }
];
const PLATFORM_SELECTION_PAGE_SIZE = 10;
const PLATFORM_STATUS_SORT_ORDER = new Map([
  ['موجود جزئيًا', 0],
  ['موجود بالكامل', 1],
  ['غير موجود', 2]
]);

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

function getPlatformBundleRoots(platform) {
  const roots = [];
  const seen = new Set();
  const mirrorDirectories = Array.isArray(platform.mirror_directories) ? platform.mirror_directories.filter(Boolean) : [];

  for (const mirrorDirectory of mirrorDirectories) {
    if (!seen.has(mirrorDirectory)) {
      seen.add(mirrorDirectory);
      roots.push(mirrorDirectory);
    }
  }

  for (const outputFile of platform.output_files || []) {
    const normalized = String(outputFile).replace(/\\/g, '/');
    if (!normalized.includes('/')) continue;
    const [root] = normalized.split('/');
    if (!root || seen.has(root)) continue;
    seen.add(root);
    roots.push(root);
  }

  return roots;
}

function getPlatformBundleRelativeFiles(sourceRoot, selectedPlatforms) {
  const relativeFiles = [];
  const seen = new Set();
  const bundleRoots = [...new Set(selectedPlatforms.flatMap((item) => getPlatformBundleRoots(item)))];

  for (const bundleRoot of bundleRoots) {
    for (const bundleDirectory of PLATFORM_BUNDLE_DIRECTORIES) {
      const sourceDir = join(sourceRoot, ...bundleDirectory.sourceSegments);
      for (const filePath of collectRelativeFiles(sourceDir)) {
        const relativePath = join(bundleRoot, bundleDirectory.targetName, filePath);
        if (seen.has(relativePath)) continue;
        seen.add(relativePath);
        relativeFiles.push(relativePath);
      }
    }
  }

  return relativeFiles;
}

function copyPlatformBundles(sourceRoot, targetRoot, selectedPlatforms, force, summary) {
  const copiedRoots = new Set();

  for (const platform of selectedPlatforms) {
    for (const bundleRoot of getPlatformBundleRoots(platform)) {
      if (copiedRoots.has(bundleRoot)) continue;
      copiedRoots.add(bundleRoot);

      for (const bundleDirectory of PLATFORM_BUNDLE_DIRECTORIES) {
        copyManagedTree(
          join(sourceRoot, ...bundleDirectory.sourceSegments),
          join(targetRoot, bundleRoot, bundleDirectory.targetName),
          force,
          summary
        );
      }
    }
  }
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

function translatePlatformStatusForPrompt(status) {
  if (status === 'موجود بالكامل') return 'fully present';
  if (status === 'موجود جزئيًا') return 'partially present';
  return 'not present';
}

function getPlatformStatusTag(status) {
  if (status === 'موجود بالكامل') return 'present';
  if (status === 'موجود جزئيًا') return 'partial';
  return 'missing';
}

function getPlatformStatusSortValue(status) {
  return PLATFORM_STATUS_SORT_ORDER.get(status) ?? 99;
}

function sortPlatformStatuses(platformStatuses) {
  return [...platformStatuses].sort((left, right) => {
    const statusDiff = getPlatformStatusSortValue(left.status) - getPlatformStatusSortValue(right.status);
    if (statusDiff !== 0) return statusDiff;
    return String(left.key).localeCompare(String(right.key), 'en', { sensitivity: 'base' });
  });
}

function buildPlatformSearchText(platformStatus) {
  return [
    platformStatus.key,
    platformStatus.display_name,
    translatePlatformStatusForPrompt(platformStatus.status),
    ...(platformStatus.managed_outputs || [])
  ]
    .join(' ')
    .toLowerCase();
}

function getFilteredPlatformStatuses(platformStatuses, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
  if (!normalizedQuery) return platformStatuses;
  return platformStatuses.filter((item) => buildPlatformSearchText(item).includes(normalizedQuery));
}

function normalizePlatformSelectionState(state, platformStatuses) {
  const pageSize = Number.isInteger(state.pageSize) && state.pageSize > 0
    ? state.pageSize
    : PLATFORM_SELECTION_PAGE_SIZE;
  const filteredPlatforms = getFilteredPlatformStatuses(platformStatuses, state.searchQuery);
  const nextState = {
    cursorIndex: Math.max(0, state.cursorIndex || 0),
    scrollOffset: Math.max(0, state.scrollOffset || 0),
    selectedKeys: new Set(state.selectedKeys || []),
    searchQuery: String(state.searchQuery || ''),
    message: String(state.message || ''),
    pageSize
  };

  if (filteredPlatforms.length === 0) {
    nextState.cursorIndex = 0;
    nextState.scrollOffset = 0;
    return { state: nextState, filteredPlatforms };
  }

  nextState.cursorIndex = Math.min(nextState.cursorIndex, filteredPlatforms.length - 1);
  const maxScrollOffset = Math.max(0, filteredPlatforms.length - pageSize);

  if (nextState.scrollOffset > nextState.cursorIndex) {
    nextState.scrollOffset = nextState.cursorIndex;
  }

  const visibleEndIndex = nextState.scrollOffset + pageSize - 1;
  if (nextState.cursorIndex > visibleEndIndex) {
    nextState.scrollOffset = nextState.cursorIndex - pageSize + 1;
  }

  nextState.scrollOffset = Math.min(Math.max(nextState.scrollOffset, 0), maxScrollOffset);
  return { state: nextState, filteredPlatforms };
}

function getPlatformSelectionView(platformStatuses, state) {
  const orderedPlatforms = sortPlatformStatuses(platformStatuses);
  const normalized = normalizePlatformSelectionState(state, orderedPlatforms);
  const pageItems = normalized.filteredPlatforms.slice(
    normalized.state.scrollOffset,
    normalized.state.scrollOffset + normalized.state.pageSize
  );

  return {
    orderedPlatforms,
    filteredPlatforms: normalized.filteredPlatforms,
    pageItems,
    currentItem: normalized.filteredPlatforms[normalized.state.cursorIndex] ?? null,
    hasMoreAbove: normalized.state.scrollOffset > 0,
    hasMoreBelow: normalized.state.scrollOffset + normalized.state.pageSize < normalized.filteredPlatforms.length,
    rangeStart: normalized.filteredPlatforms.length === 0 ? 0 : normalized.state.scrollOffset + 1,
    rangeEnd: Math.min(
      normalized.filteredPlatforms.length,
      normalized.state.scrollOffset + normalized.state.pageSize
    ),
    state: normalized.state
  };
}

function parsePlatformSelectionCommand(answer, platformStatuses) {
  const trimmed = String(answer || '').trim();
  if (!trimmed) return { action: 'confirm' };

  const normalized = trimmed.toLowerCase();
  if (['all', '*', 'select-all'].includes(normalized)) {
    return { action: 'select_all' };
  }

  if (['none', 'clear', 'clear-all', 'unselect-all'].includes(normalized)) {
    return { action: 'clear_selection' };
  }

  if (['cancel', 'exit', 'quit'].includes(normalized)) {
    return { action: 'cancel' };
  }

  const byIndex = new Map(platformStatuses.map((item, index) => [String(index + 1), item.key]));
  const availableKeys = new Set(platformStatuses.map((item) => String(item.key).toLowerCase()));
  const selectedKeys = [];

  for (const token of trimmed.split(/[,\s]+/).filter(Boolean)) {
    if (byIndex.has(token)) {
      selectedKeys.push(byIndex.get(token));
      continue;
    }

    const normalizedToken = token.toLowerCase();
    if (availableKeys.has(normalizedToken)) {
      selectedKeys.push(normalizedToken);
      continue;
    }

    return null;
  }

  if (selectedKeys.length === 0) return null;
  return {
    action: 'toggle',
    keys: [...new Set(selectedKeys)]
  };
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
      'Systematize KIT is already installed. Reinstalling will create a snapshot and rewrite the managed files for the platforms you select. Continue? [y/N]: '
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

function createPlatformSelectionState(platformStatuses) {
  return normalizePlatformSelectionState({
    cursorIndex: 0,
    scrollOffset: 0,
    selectedKeys: new Set(),
    searchQuery: '',
    message: '',
    pageSize: PLATFORM_SELECTION_PAGE_SIZE
  }, sortPlatformStatuses(platformStatuses)).state;
}

function applyPlatformSelectionKey(state, key, platformStatuses, input = '') {
  const orderedPlatforms = sortPlatformStatuses(platformStatuses);
  const { state: normalizedState, filteredPlatforms } = normalizePlatformSelectionState(state, orderedPlatforms);
  const nextState = {
    ...normalizedState,
    selectedKeys: new Set(normalizedState.selectedKeys),
    message: ''
  };
  const lastIndex = Math.max(0, filteredPlatforms.length - 1);
  const moveCursor = (targetIndex) => {
    nextState.cursorIndex = Math.min(Math.max(targetIndex, 0), lastIndex);
  };

  if (key?.ctrl && key?.name === 'a') {
    if (key.shift) {
      nextState.selectedKeys.clear();
    } else {
      nextState.selectedKeys = new Set(orderedPlatforms.map((item) => item.key));
    }
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'up') {
    moveCursor(nextState.cursorIndex - 1);
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'down') {
    moveCursor(nextState.cursorIndex + 1);
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'pageup') {
    moveCursor(nextState.cursorIndex - nextState.pageSize);
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'pagedown') {
    moveCursor(nextState.cursorIndex + nextState.pageSize);
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'home') {
    nextState.cursorIndex = 0;
    nextState.scrollOffset = 0;
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'end') {
    nextState.cursorIndex = lastIndex;
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'space') {
    const currentItem = filteredPlatforms[nextState.cursorIndex];
    if (!currentItem) {
      nextState.message = 'No platforms match the current search.';
      return {
        done: false,
        cancelled: false,
        state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
      };
    }

    if (nextState.selectedKeys.has(currentItem.key)) nextState.selectedKeys.delete(currentItem.key);
    else nextState.selectedKeys.add(currentItem.key);

    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'backspace') {
    if (nextState.searchQuery) {
      nextState.searchQuery = nextState.searchQuery.slice(0, -1);
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
    }
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  if (key?.name === 'escape') {
    if (nextState.searchQuery) {
      nextState.searchQuery = '';
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
      return {
        done: false,
        cancelled: false,
        state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
      };
    }

    return {
      done: false,
      cancelled: true,
      state: nextState
    };
  }

  if (key?.name === 'return' || key?.name === 'enter') {
    if (nextState.selectedKeys.size === 0) {
      nextState.message = 'Select at least one platform to continue.';
      return {
        done: false,
        cancelled: false,
        state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
      };
    }

    return {
      done: true,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  const printableInput = typeof input === 'string' ? input : '';
  const isSearchInput =
    printableInput &&
    !key?.ctrl &&
    !key?.meta &&
    /^[ -~]$/.test(printableInput);

  if (isSearchInput) {
    if (printableInput !== '/') {
      nextState.searchQuery += printableInput;
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
    }
    return {
      done: false,
      cancelled: false,
      state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
    };
  }

  return {
    done: false,
    cancelled: false,
    state: normalizePlatformSelectionState(nextState, orderedPlatforms).state
  };
}

function renderPlatformSelectionScreen(platformStatuses, state) {
  const view = getPlatformSelectionView(platformStatuses, state);
  console.clear();
  console.log('Select the platforms to reinstall');
  console.log('Controls: Up/Down move | PageUp/PageDown page | Home/End jump');
  console.log('Controls: Space toggle | Ctrl+A select all | Ctrl+Shift+A clear all | Enter confirm');
  console.log('Controls: Type to filter | Backspace delete | Esc clear search or cancel');
  console.log(`Search: ${view.state.searchQuery || '(type to filter)'}`);
  console.log(
    `Selected: ${view.state.selectedKeys.size} | Matching: ${view.filteredPlatforms.length} | Total: ${view.orderedPlatforms.length}`
  );
  console.log('');

  if (view.hasMoreAbove) {
    console.log('↑ more above');
  }

  if (view.pageItems.length === 0) {
    console.log('No platforms match the current search.');
  }

  for (const [index, entry] of view.pageItems.entries()) {
    const absoluteIndex = view.state.scrollOffset + index;
    const pointer = absoluteIndex === view.state.cursorIndex ? '>' : ' ';
    const isSelected = view.state.selectedKeys.has(entry.key);
    console.log(
      `${pointer} ${isSelected ? '[x]' : '[ ]'} ${entry.key} - ${entry.display_name} (${getPlatformStatusTag(entry.status)})`
    );
  }

  if (view.hasMoreBelow) {
    console.log('↓ more below');
  }

  if (view.currentItem) {
    console.log('');
    console.log(`Focused outputs: ${view.currentItem.managed_outputs.join(', ')}`);
  }

  if (view.state.message) {
    console.log('');
    console.log(view.state.message);
  }
}

async function promptForPlatformSelections(platformStatuses) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Interactive platform selection is not supported in this terminal.');
  }

  emitKeypressEvents(process.stdin);
  const originalRawMode = Boolean(process.stdin.isRaw);
  let state = createPlatformSelectionState(platformStatuses);

  return await new Promise((resolve, reject) => {
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(originalRawMode);
      process.stdin.pause();
    };

    const onKeypress = (input, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Platform selection cancelled by user.'));
        return;
      }

      const result = applyPlatformSelectionKey(state, key, platformStatuses, input);
      state = result.state;

      if (result.cancelled) {
        cleanup();
        console.clear();
        reject(new Error('Platform selection cancelled by user.'));
        return;
      }

      if (result.done) {
        const orderedPlatforms = sortPlatformStatuses(platformStatuses);
        const selectedKeys = orderedPlatforms
          .filter((item) => state.selectedKeys.has(item.key))
          .map((item) => item.key);
        cleanup();
        console.clear();
        resolve(selectedKeys);
        return;
      }

      renderPlatformSelectionScreen(platformStatuses, state);
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    renderPlatformSelectionScreen(platformStatuses, state);
    process.stdin.on('keypress', onKeypress);
  });
}

async function promptForPlatformSelectionsFallback(platformStatuses) {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const selectedKeys = new Set();
  let message = '';

  try {
    while (true) {
      if (process.stdout.isTTY) {
        console.clear();
      }

      console.log('Select the platforms to reinstall');
      console.log('Commands: type numbers or keys to toggle | "all" select all | "none" clear all');
      console.log('Commands: press Enter to confirm | type "cancel" to cancel');
      console.log(`Selected: ${selectedKeys.size} | Total: ${platformStatuses.length}`);
      console.log('');

      for (const [index, platform] of platformStatuses.entries()) {
        const marker = selectedKeys.has(platform.key) ? '[x]' : '[ ]';
        console.log(
          `[${index + 1}] ${marker} ${platform.key} - ${platform.display_name} (${getPlatformStatusTag(platform.status)})`
        );
      }

      if (message) {
        console.log('');
        console.log(message);
      }

      const answer = await prompt.question('Platform selection: ');
      const command = parsePlatformSelectionCommand(answer, platformStatuses);

      if (!command) {
        message = 'Invalid selection. Use numbers, platform keys, "all", "none", or "cancel".';
        continue;
      }

      if (command.action === 'confirm') {
        if (selectedKeys.size === 0) {
          message = 'Select at least one platform to continue.';
          continue;
        }

        return platformStatuses.filter((item) => selectedKeys.has(item.key)).map((item) => item.key);
      }

      if (command.action === 'cancel') {
        throw new Error('Platform selection cancelled by user.');
      }

      if (command.action === 'select_all') {
        selectedKeys.clear();
        for (const platform of platformStatuses) {
          selectedKeys.add(platform.key);
        }
        message = '';
        continue;
      }

      if (command.action === 'clear_selection') {
        selectedKeys.clear();
        message = '';
        continue;
      }

      if (command.action === 'toggle') {
        for (const selectedKey of command.keys) {
          if (selectedKeys.has(selectedKey)) selectedKeys.delete(selectedKey);
          else selectedKeys.add(selectedKey);
        }
        message = '';
      }
    }
  } finally {
    prompt.close();
  }
}

async function resolveSelectedPlatforms({
  allPlatforms,
  requestedKeys,
  targetRoot,
  supportsPrompting,
  supportsRawMenu,
  shouldPrompt
}) {
  const explicitSelection = Array.isArray(requestedKeys) && requestedKeys.length > 0;
  if (explicitSelection) {
    return allPlatforms.filter((item) => requestedKeys.includes(item.key));
  }

  if (!shouldPrompt || !supportsPrompting) {
    return allPlatforms;
  }

  const platformStatuses = sortPlatformStatuses(
    allPlatforms.map((item) => buildPlatformStatus(item, targetRoot))
  );
  const selectedKeys = supportsRawMenu
    ? await promptForPlatformSelections(platformStatuses)
    : await promptForPlatformSelectionsFallback(platformStatuses);

  return allPlatforms.filter((item) => selectedKeys.includes(item.key));
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

function writeInstallState({ sourceRoot, targetRoot, selectedPlatforms, summary, detection }) {
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
