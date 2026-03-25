import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import {
  buildPlatformStatus,
  copyPlatformBundles,
  expandPlatformOutputTargets,
  getPlatformBundleRelativeFiles
} from './init-syskit-platform-bundles.mjs';
import {
  promptForPlatformSelections,
  promptForPlatformSelectionsFallback
} from './init-syskit-platform-prompts.mjs';

const PLATFORM_SELECTION_PAGE_SIZE = 10;
const PLATFORM_STATUS_SORT_ORDER = new Map([
  ['موجود جزئيًا', 0],
  ['موجود بالكامل', 1],
  ['غير موجود', 2]
]);

export { buildPlatformStatus, copyPlatformBundles, expandPlatformOutputTargets, getPlatformBundleRelativeFiles };

export function isInteractiveSession(jsonMode) {
  return !jsonMode && process.stdin.isTTY && process.stdout.isTTY;
}

export function isAffirmativeAnswer(answer) {
  const normalized = String(answer || '').trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'ok', 'okay', 'نعم', 'ايوه', 'أيوه', 'اه', 'موافق'].includes(normalized);
}

export function translatePlatformStatusForPrompt(status) {
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

export function sortPlatformStatuses(platformStatuses) {
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

  if (nextState.scrollOffset > nextState.cursorIndex) nextState.scrollOffset = nextState.cursorIndex;

  const visibleEndIndex = nextState.scrollOffset + pageSize - 1;
  if (nextState.cursorIndex > visibleEndIndex) {
    nextState.scrollOffset = nextState.cursorIndex - pageSize + 1;
  }

  nextState.scrollOffset = Math.min(Math.max(nextState.scrollOffset, 0), maxScrollOffset);
  return { state: nextState, filteredPlatforms };
}

export function getPlatformSelectionView(platformStatuses, state) {
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

export function parsePlatformSelectionCommand(answer, platformStatuses) {
  const trimmed = String(answer || '').trim();
  if (!trimmed) return { action: 'confirm' };

  const normalized = trimmed.toLowerCase();
  if (['all', '*', 'select-all'].includes(normalized)) return { action: 'select_all' };
  if (['none', 'clear', 'clear-all', 'unselect-all'].includes(normalized)) return { action: 'clear_selection' };
  if (['cancel', 'exit', 'quit'].includes(normalized)) return { action: 'cancel' };

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
  return { action: 'toggle', keys: [...new Set(selectedKeys)] };
}

export async function resolveReinstallDecision({ detection, force, interactive }) {
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
      'Systematize Framework is already installed. Reinstalling will create a snapshot and rewrite the managed files for the platforms you select. Continue? [y/N]: '
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

export function createPlatformSelectionState(platformStatuses) {
  return normalizePlatformSelectionState({
    cursorIndex: 0,
    scrollOffset: 0,
    selectedKeys: new Set(),
    searchQuery: '',
    message: '',
    pageSize: PLATFORM_SELECTION_PAGE_SIZE
  }, sortPlatformStatuses(platformStatuses)).state;
}

export function applyPlatformSelectionKey(state, key, platformStatuses, input = '') {
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
    nextState.selectedKeys = key.shift
      ? new Set()
      : new Set(orderedPlatforms.map((item) => item.key));
  } else if (key?.name === 'up') {
    moveCursor(nextState.cursorIndex - 1);
  } else if (key?.name === 'down') {
    moveCursor(nextState.cursorIndex + 1);
  } else if (key?.name === 'pageup') {
    moveCursor(nextState.cursorIndex - nextState.pageSize);
  } else if (key?.name === 'pagedown') {
    moveCursor(nextState.cursorIndex + nextState.pageSize);
  } else if (key?.name === 'home') {
    nextState.cursorIndex = 0;
    nextState.scrollOffset = 0;
  } else if (key?.name === 'end') {
    nextState.cursorIndex = lastIndex;
  } else if (key?.name === 'space') {
    const currentItem = filteredPlatforms[nextState.cursorIndex];
    if (!currentItem) {
      nextState.message = 'No platforms match the current search.';
      return { done: false, cancelled: false, state: normalizePlatformSelectionState(nextState, orderedPlatforms).state };
    }
    if (nextState.selectedKeys.has(currentItem.key)) nextState.selectedKeys.delete(currentItem.key);
    else nextState.selectedKeys.add(currentItem.key);
  } else if (key?.name === 'backspace') {
    if (nextState.searchQuery) {
      nextState.searchQuery = nextState.searchQuery.slice(0, -1);
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
    }
  } else if (key?.name === 'escape') {
    if (nextState.searchQuery) {
      nextState.searchQuery = '';
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
      return { done: false, cancelled: false, state: normalizePlatformSelectionState(nextState, orderedPlatforms).state };
    }
    return { done: false, cancelled: true, state: nextState };
  } else if (key?.name === 'return' || key?.name === 'enter') {
    if (nextState.selectedKeys.size === 0) {
      nextState.message = 'Select at least one platform to continue.';
      return { done: false, cancelled: false, state: normalizePlatformSelectionState(nextState, orderedPlatforms).state };
    }
    return { done: true, cancelled: false, state: normalizePlatformSelectionState(nextState, orderedPlatforms).state };
  } else {
    const printableInput = typeof input === 'string' ? input : '';
    const isSearchInput = printableInput && !key?.ctrl && !key?.meta && /^[ -~]$/.test(printableInput);
    if (isSearchInput && printableInput !== '/') {
      nextState.searchQuery += printableInput;
      nextState.cursorIndex = 0;
      nextState.scrollOffset = 0;
    }
  }

  return { done: false, cancelled: false, state: normalizePlatformSelectionState(nextState, orderedPlatforms).state };
}

export async function resolveSelectedPlatforms({
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
    ? await promptForPlatformSelections({
      platformStatuses,
      createPlatformSelectionState,
      applyPlatformSelectionKey,
      getPlatformSelectionView,
      sortPlatformStatuses,
      getPlatformStatusTag
    })
    : await promptForPlatformSelectionsFallback({
      platformStatuses,
      parsePlatformSelectionCommand,
      getPlatformStatusTag
    });

  return allPlatforms.filter((item) => selectedKeys.includes(item.key));
}

export function buildPlatformOutputMap(platforms) {
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
