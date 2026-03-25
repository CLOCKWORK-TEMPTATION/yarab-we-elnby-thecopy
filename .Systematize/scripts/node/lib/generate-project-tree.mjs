import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const outputPath = join(repoRoot, 'docs', '_project_tree.json');
const includeRootFiles = ['README.md', 'package.json', 'package-lock.json', 'install-syskit.ps1'];
const includeDirectories = ['commands', '.Systematize', 'docs'];
const excludeDirectories = new Set(['.git', 'node_modules']);
const excludeRelativeDirectories = new Set([
  '.Systematize/exports',
  '.Systematize/snapshots'
]);
const includeExtensionlessFiles = new Set(['pre-commit']);

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function detectLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function applyLineEnding(content, lineEnding) {
  return content.replace(/\n/g, lineEnding);
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => left.localeCompare(right, 'en'));
}

function buildDirectoryTree(relativeDir) {
  const absoluteDir = join(repoRoot, relativeDir);
  const files = [];
  const directories = {};

  for (const entry of sortEntries(readdirSync(absoluteDir))) {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (excludeDirectories.has(entry)) continue;
      if (excludeRelativeDirectories.has(normalizeRelativePath(relativePath))) continue;
      directories[entry] = buildDirectoryTree(relativePath);
      continue;
    }

    const extension = extname(entry).toLowerCase();
    if (includeExtensionlessFiles.has(entry) || ['.json', '.md', '.mjs', '.ps1', '.yml', '.yaml'].includes(extension)) {
      files.push(entry);
    }
  }

  if (Object.keys(directories).length === 0) {
    return files;
  }

  return {
    files,
    directories
  };
}

function buildTree() {
  return {
    project: 'Systematize Framework for Software Project Governance',
    generated_by: '.Systematize/scripts/node/lib/generate-project-tree.mjs',
    root: {
      files: includeRootFiles.filter((fileName) => existsSync(join(repoRoot, fileName))),
      directories: Object.fromEntries(
        includeDirectories
          .filter((directoryName) => existsSync(join(repoRoot, directoryName)))
          .map((directoryName) => [directoryName, buildDirectoryTree(directoryName)])
      )
    }
  };
}

const shouldCheck = process.argv.includes('--check');
const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
const lineEnding = detectLineEnding(current);
const expected = applyLineEnding(JSON.stringify(buildTree(), null, 2), lineEnding);

if (shouldCheck) {
  if (current.trimEnd() !== expected.trimEnd()) {
    console.error(`Generated project tree is out of date: ${outputPath}`);
    process.exit(1);
  }

  console.log('Project tree is up to date.');
} else {
  writeFileSync(outputPath, `${expected}${lineEnding}`, 'utf8');
  console.log(`Generated ${outputPath}`);
}
