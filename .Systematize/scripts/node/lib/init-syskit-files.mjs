import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ensureDir } from './common.mjs';

export function trackWrite(summary, targetPath, existedBefore) {
  summary.written.push(targetPath);

  if (existedBefore) {
    summary.overwritten_paths.push(targetPath);
  } else {
    summary.created_paths.push(targetPath);
  }
}

export function copyManagedTree(sourceDir, targetDir, force, summary) {
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

export function writeIfNeeded(targetPath, content, force, summary) {
  const existedBefore = existsSync(targetPath);
  if (existedBefore && !force) {
    summary.skipped.push(targetPath);
    return;
  }

  ensureDir(dirname(targetPath));
  writeFileSync(targetPath, content, 'utf8');
  trackWrite(summary, targetPath, existedBefore);
}

export function appendGitIgnore(targetPath, force, summary) {
  const block = [
    '# Systematize Framework',
    '.Systematize/exports/',
    '.Systematize/snapshots/',
    ''
  ].join('\n');

  if (!existsSync(targetPath)) {
    writeIfNeeded(targetPath, block, force, summary);
    return;
  }

  const current = readFileSync(targetPath, 'utf8');
  if (current.includes('# Systematize Framework')) {
    summary.skipped.push(targetPath);
    return;
  }

  const next = `${current.replace(/\s*$/, '')}\n\n${block}`;
  writeFileSync(targetPath, next, 'utf8');
  trackWrite(summary, targetPath, true);
}

export function collectRelativeFiles(baseDir, currentDir = baseDir) {
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
