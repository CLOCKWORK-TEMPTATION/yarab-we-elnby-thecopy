import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';

export async function promptForPlatformSelections({
  platformStatuses,
  createPlatformSelectionState,
  applyPlatformSelectionKey,
  getPlatformSelectionView,
  sortPlatformStatuses,
  getPlatformStatusTag
}) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Interactive platform selection is not supported in this terminal.');
  }

  const renderPlatformSelectionScreen = (state) => {
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

    if (view.hasMoreAbove) console.log('↑ more above');
    if (view.pageItems.length === 0) console.log('No platforms match the current search.');

    for (const [index, entry] of view.pageItems.entries()) {
      const absoluteIndex = view.state.scrollOffset + index;
      const pointer = absoluteIndex === view.state.cursorIndex ? '>' : ' ';
      const isSelected = view.state.selectedKeys.has(entry.key);
      console.log(`${pointer} ${isSelected ? '[x]' : '[ ]'} ${entry.key} - ${entry.display_name} (${getPlatformStatusTag(entry.status)})`);
    }

    if (view.hasMoreBelow) console.log('↓ more below');

    if (view.currentItem) {
      console.log('');
      console.log(`Focused outputs: ${view.currentItem.managed_outputs.join(', ')}`);
    }

    if (view.state.message) {
      console.log('');
      console.log(view.state.message);
    }
  };

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

      renderPlatformSelectionScreen(state);
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    renderPlatformSelectionScreen(state);
    process.stdin.on('keypress', onKeypress);
  });
}

export async function promptForPlatformSelectionsFallback({
  platformStatuses,
  parsePlatformSelectionCommand,
  getPlatformStatusTag
}) {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const selectedKeys = new Set();
  let message = '';

  try {
    while (true) {
      if (process.stdout.isTTY) console.clear();

      console.log('Select the platforms to reinstall');
      console.log('Commands: type numbers or keys to toggle | "all" select all | "none" clear all');
      console.log('Commands: press Enter to confirm | type "cancel" to cancel');
      console.log(`Selected: ${selectedKeys.size} | Total: ${platformStatuses.length}`);
      console.log('');

      for (const [index, platform] of platformStatuses.entries()) {
        const marker = selectedKeys.has(platform.key) ? '[x]' : '[ ]';
        console.log(`[${index + 1}] ${marker} ${platform.key} - ${platform.display_name} (${getPlatformStatusTag(platform.status)})`);
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
        for (const platform of platformStatuses) selectedKeys.add(platform.key);
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
