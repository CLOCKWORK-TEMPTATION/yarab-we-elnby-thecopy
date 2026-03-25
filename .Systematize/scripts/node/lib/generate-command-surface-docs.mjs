import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const catalogPath = join(repoRoot, '.Systematize', 'config', 'command-catalog.json');

const PRIMARY_MARKER = 'PRIMARY_SURFACE';
const SECONDARY_MARKER = 'SECONDARY_SURFACE';

function detectLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function applyLineEnding(content, lineEnding) {
  return content.replace(/\n/g, lineEnding);
}

function ensureSingleTrailingNewline(content, lineEnding) {
  return `${content.replace(/(?:\r?\n)+$/u, '')}${lineEnding}`;
}

function toCommandToken(name) {
  return `/syskit.${name}`;
}

function replaceGeneratedBlock(content, markerName, replacement) {
  const pattern = new RegExp(
    `<!-- GENERATED:${markerName}:BEGIN -->[\\s\\S]*?<!-- GENERATED:${markerName}:END -->`,
    'm'
  );

  if (!pattern.test(content)) {
    throw new Error(`Missing generated marker block: ${markerName}`);
  }

  return content.replace(
    pattern,
    `<!-- GENERATED:${markerName}:BEGIN -->\n${replacement}\n<!-- GENERATED:${markerName}:END -->`
  );
}

function buildPrimaryPath(commands) {
  return commands
    .filter((command) => command.visibility === 'primary' && command.family === 'Gate')
    .sort((left, right) => left.stage.localeCompare(right.stage))
    .map((command) => toCommandToken(command.name))
    .join(' -> ');
}

function buildPrimaryStarterRows(commands) {
  const starters = commands.filter((command) => ['guide', 'init', 'systematize'].includes(command.name));
  return starters.map((command) => `| \`${toCommandToken(command.name)}\` | ${command.notes} | ${command.requirement_level === 'mandatory' ? 'إلزامي بحسب الحالة' : 'اختياري'} |`);
}

function buildSecondaryRows(commands, visibility) {
  return commands
    .filter((command) => command.visibility === visibility)
    .map((command) => `| \`${toCommandToken(command.name)}\` | ${command.family} | ${command.execution_mode} | ${command.notes} |`);
}

function buildReadmeBlock(catalog) {
  const primaryPath = buildPrimaryPath(catalog.commands);
  const primaryRows = buildPrimaryStarterRows(catalog.commands).join('\n');

  return [
    '## السطح الأول',
    '',
    'هذا السطح يعرض أوامر البداية فقط، ويخفي الطبقات التشغيلية والاختيارية حتى لا يتضخم القرار الأول.',
    '',
    '| الأمر | دوره على السطح الأول | حالته |',
    '| --- | --- | --- |',
    primaryRows,
    '',
    'المسار الإلزامي الكامل بعد نقطة البداية:',
    '',
    '```text',
    primaryPath,
    '```',
    '',
    'أما الأوامر التشغيلية والاختيارية فتوجد في المرجع الثانوي:',
    '',
    '```text',
    'docs/REFERENCE.md',
    '```'
  ].join('\n');
}

function buildStartHereBlock(catalog) {
  const primaryPath = buildPrimaryPath(catalog.commands);
  const primaryRows = buildPrimaryStarterRows(catalog.commands).join('\n');

  return [
    '## جدول القرار السريع',
    '',
    '| الأمر | متى أستخدمه؟ | الحالة |',
    '| --- | --- | --- |',
    primaryRows,
    '',
    '## المسار الإلزامي الكامل',
    '',
    '```text',
    primaryPath,
    '```',
    '',
    'كل ما هو خارج هذا السطح ينتقل إلى المرجع الثانوي:',
    '',
    '```text',
    'docs/REFERENCE.md',
    '```'
  ].join('\n');
}

function buildReferenceBlock(catalog) {
  const operationalRows = buildSecondaryRows(catalog.commands, 'operational').join('\n');
  const optionalRows = buildSecondaryRows(catalog.commands, 'optional').join('\n');

  return [
    '## فهرس السطح الثانوي',
    '',
    '### السطح التشغيلي',
    '',
    '| الأمر | العائلة | النمط | الملاحظة |',
    '| --- | --- | --- | --- |',
    operationalRows,
    '',
    '### السطح الاختياري',
    '',
    '| الأمر | العائلة | النمط | الملاحظة |',
    '| --- | --- | --- | --- |',
    optionalRows,
    '',
    'الخريطة الكاملة تبقى هنا:',
    '',
    '```text',
    'docs/COMMAND_RUNTIME_MAP.md',
    '```'
  ].join('\n');
}

function updateFile(relativePath, builder, catalog, shouldCheck) {
  const absolutePath = join(repoRoot, relativePath);
  const current = existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
  const lineEnding = detectLineEnding(current);
  const markerName = relativePath === 'docs/REFERENCE.md' ? SECONDARY_MARKER : PRIMARY_MARKER;
  const expected = ensureSingleTrailingNewline(
    applyLineEnding(replaceGeneratedBlock(current, markerName, builder(catalog)), lineEnding),
    lineEnding
  );

  if (shouldCheck) {
    if (current !== expected) {
      throw new Error(`Generated command surface document is out of date: ${relativePath}`);
    }
    return;
  }

  writeFileSync(absolutePath, expected, 'utf8');
}

const shouldCheck = process.argv.includes('--check');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

try {
  updateFile('README.md', buildReadmeBlock, catalog, shouldCheck);
  updateFile('docs/START_HERE.md', buildStartHereBlock, catalog, shouldCheck);
  updateFile('docs/REFERENCE.md', buildReferenceBlock, catalog, shouldCheck);
  console.log(
    shouldCheck
      ? 'Command surface documents are up to date.'
      : 'Generated command surface documents.'
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
