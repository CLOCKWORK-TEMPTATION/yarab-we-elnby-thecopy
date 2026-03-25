import { basename, extname, join } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';

const SKIP_DIRECTORIES = new Set([
  '.git',
  '.claude',
  '.agents',
  '.aider',
  '.amp',
  '.augment',
  '.bob',
  '.clinerules',
  '.codebuddy',
  '.codex',
  '.continue',
  '.gemini',
  '.kiro-cli',
  '.opencode',
  '.qoder',
  '.qodercli',
  '.qwen',
  '.roo',
  '.shai',
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.Systematize',
  '.turbo'
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.json', '.md', '.yml', '.yaml', '.env', '.txt'
]);

const TEXT_FILENAMES = new Set([
  '.env',
  '.env.local',
  '.env.example',
  '.npmrc',
  '.gitignore',
  '.dockerignore',
  '.eslintignore',
  '.prettierignore'
]);

export function collectRepositoryFiles(rootDir, options = {}) {
  const files = [];
  const maxFiles = options.maxFiles || 500;

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (files.length >= maxFiles) return;

      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        walk(absolutePath);
        continue;
      }

      files.push(absolutePath);
    }
  }

  walk(rootDir);
  return files;
}

export function readTextFile(filePath) {
  try {
    const extension = extname(filePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension) && !TEXT_FILENAMES.has(basename(filePath)) && !/\.env(\.|$)/i.test(filePath)) {
      return '';
    }

    if (!statSync(filePath).isFile()) return '';
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}
