import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');

const TARGET_FILES = [
  'README.md',
  'docs/START_HERE.md',
  'docs/REFERENCE.md',
  'docs/COMMAND_RUNTIME_MAP.md',
  'docs/policies/README.md',
  'docs/policies/analyze-policy.md',
  'docs/policies/checklist-policy.md',
  'docs/policies/clarify-policy.md',
  'docs/policies/implement-policy.md',
  'docs/policies/research-policy.md',
  'docs/policies/systematize-policy.md',
  'docs/policies/tasks-policy.md'
];
const POLICY_SURFACE_FILES = new Set([
  'docs/policies/analyze-policy.md',
  'docs/policies/checklist-policy.md',
  'docs/policies/clarify-policy.md',
  'docs/policies/implement-policy.md',
  'docs/policies/research-policy.md',
  'docs/policies/systematize-policy.md',
  'docs/policies/tasks-policy.md'
]);
const POLICY_SURFACE_LINE_LIMIT = 40;

const arabicPattern = /[\u0600-\u06FF]/;
const latinPattern = /[A-Za-z]/;

function isIgnoredLine(line) {
  const trimmed = line.trim();
  return trimmed.length === 0
    || trimmed.startsWith('<!--')
    || trimmed.startsWith('|')
    || trimmed.startsWith('- ')
    || trimmed.startsWith('* ')
    || trimmed.startsWith('> ')
    || /^\d+\./.test(trimmed)
    || trimmed.startsWith('```')
    || trimmed.includes('`')
    || trimmed.includes('docs/')
    || trimmed.includes('/syskit.')
    || trimmed.includes('.md')
    || trimmed.includes('.mjs')
    || trimmed.includes('.ps1');
}

function shouldInspectLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('##')) return true;
  if (trimmed.startsWith('###')) return true;
  return trimmed.length > 24;
}

const failures = [];

for (const relativePath of TARGET_FILES) {
  const content = readFileSync(join(repoRoot, relativePath), 'utf8');
  const lines = content.split(/\r?\n/);
  let insideCodeFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      insideCodeFence = !insideCodeFence;
      continue;
    }

    if (POLICY_SURFACE_FILES.has(relativePath) && index + 1 > POLICY_SURFACE_LINE_LIMIT) {
      continue;
    }

    if (insideCodeFence || isIgnoredLine(line) || !shouldInspectLine(line)) {
      continue;
    }

    const hasArabic = arabicPattern.test(line);
    const hasLatin = latinPattern.test(line);

    if (hasLatin && !hasArabic) {
      failures.push(`${relativePath}:${index + 1} contains an English explanatory line`);
      continue;
    }

    if (hasLatin && hasArabic) {
      failures.push(`${relativePath}:${index + 1} mixes Arabic and English in a governing surface line`);
    }
  }
}

if (failures.length > 0) {
  console.error('Governing language verification failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Governing language verification passed.');
