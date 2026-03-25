import { execFileSync } from 'node:child_process';

function runGit(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

function parseChangedFiles(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

export function collectTrackedState(repoRoot) {
  runGit(repoRoot, ['update-index', '-q', '--refresh']);

  const workingTree = parseChangedFiles(runGit(repoRoot, ['diff', '--name-only']));
  const staged = parseChangedFiles(runGit(repoRoot, ['diff', '--cached', '--name-only']));
  const trackedFiles = [...new Set([...workingTree, ...staged])].sort();

  return {
    working_tree_files: workingTree,
    staged_files: staged,
    tracked_files: trackedFiles
  };
}

export function assertCleanTrackedState(repoRoot, contextLabel = 'Tracked repository state') {
  const state = collectTrackedState(repoRoot);
  if (state.tracked_files.length === 0) {
    return state;
  }

  const sections = [`${contextLabel} is dirty.`];

  if (state.working_tree_files.length > 0) {
    sections.push('Working tree changes:');
    sections.push(...state.working_tree_files.map((filePath) => `- ${filePath}`));
  }

  if (state.staged_files.length > 0) {
    sections.push('Staged index changes:');
    sections.push(...state.staged_files.map((filePath) => `- ${filePath}`));
  }

  throw new Error(sections.join('\n'));
}

function normalizeState(state) {
  return {
    working_tree_files: [...new Set(state?.working_tree_files || [])].sort(),
    staged_files: [...new Set(state?.staged_files || [])].sort()
  };
}

export function assertTrackedStateMatches(repoRoot, expectedState, contextLabel = 'Tracked repository state') {
  const expected = normalizeState(expectedState);
  const actual = collectTrackedState(repoRoot);

  if (
    JSON.stringify(actual.working_tree_files) === JSON.stringify(expected.working_tree_files)
    && JSON.stringify(actual.staged_files) === JSON.stringify(expected.staged_files)
  ) {
    return actual;
  }

  const sections = [`${contextLabel} drifted unexpectedly.`];

  const workingUnexpected = actual.working_tree_files.filter((filePath) => !expected.working_tree_files.includes(filePath));
  const stagedUnexpected = actual.staged_files.filter((filePath) => !expected.staged_files.includes(filePath));

  if (workingUnexpected.length > 0) {
    sections.push('Unexpected working tree changes:');
    sections.push(...workingUnexpected.map((filePath) => `- ${filePath}`));
  }

  if (stagedUnexpected.length > 0) {
    sections.push('Unexpected staged index changes:');
    sections.push(...stagedUnexpected.map((filePath) => `- ${filePath}`));
  }

  const workingCleared = expected.working_tree_files.filter((filePath) => !actual.working_tree_files.includes(filePath));
  const stagedCleared = expected.staged_files.filter((filePath) => !actual.staged_files.includes(filePath));

  if (workingCleared.length > 0) {
    sections.push('Expected working tree changes disappeared:');
    sections.push(...workingCleared.map((filePath) => `- ${filePath}`));
  }

  if (stagedCleared.length > 0) {
    sections.push('Expected staged index changes disappeared:');
    sections.push(...stagedCleared.map((filePath) => `- ${filePath}`));
  }

  throw new Error(sections.join('\n'));
}
