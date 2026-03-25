import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const catalogPath = join(repoRoot, '.Systematize', 'config', 'command-catalog.json');
const opts = new Set(process.argv.slice(2));
const checkOnly = opts.has('--check');

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function detectLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function buildMetadataLines(command) {
  return [
    `command_name: ${command.name}`,
    `command_family: ${command.family}`,
    `command_stage: ${command.stage}`,
    `command_requirement_level: ${command.requirement_level}`,
    `command_visibility: ${command.visibility}`,
    `command_execution_mode: ${command.execution_mode}`,
    `runtime_command: ${command.runtime_command ?? 'null'}`
  ];
}

function syncCommandFrontmatter(relativePath, metadataLines) {
  const content = read(relativePath);
  const lineEnding = detectLineEnding(content);
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    throw new Error(`Missing frontmatter in ${relativePath}`);
  }

  const frontmatterBody = frontmatterMatch[1];
  const existingLines = frontmatterBody.split(/\r?\n/);
  const filteredLines = existingLines.filter((line) => {
    const trimmed = line.trimStart();
    return ![
      'command_name:',
      'command_family:',
      'command_stage:',
      'command_requirement_level:',
      'command_visibility:',
      'command_execution_mode:',
      'runtime_command:'
    ].some((prefix) => trimmed.startsWith(prefix));
  });

  const descriptionIndex = filteredLines.findIndex((line) => line.trimStart().startsWith('description:'));
  const insertAt = descriptionIndex >= 0 ? descriptionIndex + 1 : 0;
  filteredLines.splice(insertAt, 0, ...metadataLines);

  const nextFrontmatter = `---${lineEnding}${filteredLines.join(lineEnding)}${lineEnding}---`;
  const nextContent = content.replace(frontmatterMatch[0], nextFrontmatter);
  const changed = nextContent !== content;

  if (changed && !checkOnly) {
    writeFileSync(join(repoRoot, relativePath), nextContent, 'utf8');
  }

  return changed;
}

const commandCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const changedFiles = [];

for (const command of commandCatalog.commands) {
  const changed = syncCommandFrontmatter(command.file, buildMetadataLines(command));
  if (changed) {
    changedFiles.push(command.file);
  }
}

if (checkOnly && changedFiles.length > 0) {
  console.error('Command metadata is out of sync:\n');
  for (const relativePath of changedFiles) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

console.log(
  checkOnly
    ? 'Command metadata is in sync.'
    : `Synchronized command metadata for ${commandCatalog.commands.length} command files.`
);
