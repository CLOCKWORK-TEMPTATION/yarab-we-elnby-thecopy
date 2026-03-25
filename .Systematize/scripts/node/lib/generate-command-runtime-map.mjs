import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const catalogPath = join(repoRoot, '.Systematize', 'config', 'command-catalog.json');
const outputPath = join(repoRoot, 'docs', 'COMMAND_RUNTIME_MAP.md');

function detectLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function applyLineEnding(content, lineEnding) {
  return content.replace(/\n/g, lineEnding);
}

function ensureSingleTrailingNewline(content, lineEnding) {
  return `${content.replace(/(?:\r?\n)+$/u, '')}${lineEnding}`;
}

function buildMarkdown(catalog) {
  const lines = [
    '# خريطة الربط بين الحوكمة والمحرك',
    '',
    'المرجع الرسمي لتصنيف أوامر الإطار الحاكم.',
    '',
    '| الأمر | العائلة | المرحلة | الإلزام | الظهور | نمط التنفيذ | الإسناد التنفيذي | الملاحظة |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
  ];

  for (const command of catalog.commands) {
    lines.push(
      `| \`${command.name}\` | ${command.family} | ${command.stage} | ${command.requirement_level} | ${command.visibility} | ${command.execution_mode} | ${command.runtime_command || '—'} | ${command.notes} |`
    );
  }

  lines.push(
    '',
    '## تفسير الأنماط',
    '',
    '- `runtime-backed`: أمر حوكمي أو تقريري يملك جسرًا تنفيذيًا حتميًا داخل المحرك ويصدر قرار قبول أو رفض قابلًا للتحقق.',
    '- `strong-hybrid`: أمر يبقي المحتوى التوليدي جزئيًا، لكن الإدخال والمسارات والتحقق والرفض النهائي محكومة بعقد تنفيذي صارم داخل المحرك.',
    '- `hybrid`: أمر يجمع بين فرض تنفيذي runtime وإنتاج توليدي — المدخلات والمخرجات والبوابات مفروضة تنفيذيًا.',
    '',
    '## طبقات الظهور',
    '',
    '- `primary`: يظهر على السطح الأول وبدايات الاستخدام.',
    '- `operational`: يظهر في السطح التشغيلي اليومي بعد فهم المسار.',
    '- `optional`: يبقى في الطبقة المرجعية أو الاختيارية ولا يتسرب إلى نقطة البداية.',
    '',
    '## تفسير العائلات',
    ''
  );

  for (const [family, description] of Object.entries(catalog.families)) {
    lines.push(`- \`${family}\`: ${description}`);
  }

  lines.push('');
  return lines.join('\n');
}

const shouldCheck = process.argv.includes('--check');
const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
const lineEnding = detectLineEnding(current);
const expected = ensureSingleTrailingNewline(
  applyLineEnding(buildMarkdown(JSON.parse(readFileSync(catalogPath, 'utf8'))), lineEnding),
  lineEnding
);

if (shouldCheck) {
  if (current !== expected) {
    console.error(`Generated command runtime map is out of date: ${outputPath}`);
    process.exit(1);
  }

  console.log('Command runtime map is up to date.');
} else {
  writeFileSync(outputPath, expected, 'utf8');
  console.log(`Generated ${outputPath}`);
}
