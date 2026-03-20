// تحديث ملفات context للـ agents — مكافئ update-agent-context.ps1
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { ensureDir, findUnresolvedPlaceholders, getFeatureDir, getFeaturePathsEnv, getRepoRoot, parseArgs, resolveTemplate } from './common.mjs';

const AGENT_TARGETS = {
  claude: { path: 'CLAUDE.md', label: 'Claude Code' },
  gemini: { path: 'GEMINI.md', label: 'Gemini CLI' },
  copilot: { path: '.github/copilot-instructions.md', label: 'GitHub Copilot' },
  'cursor-agent': { path: '.cursor/rules/syskit-rules.mdc', label: 'Cursor' },
  qwen: { path: 'QWEN.md', label: 'Qwen Code' },
  opencode: { path: 'AGENTS.md', label: 'opencode' },
  codex: { path: 'AGENTS.md', label: 'Codex CLI' },
  windsurf: { path: '.windsurf/rules/syskit-rules.md', label: 'Windsurf' },
  kilocode: { path: '.kilocode/rules/syskit-rules.md', label: 'Kilo Code' },
  auggie: { path: '.augment/rules/syskit-rules.md', label: 'Auggie CLI' },
  roo: { path: '.roo/rules/syskit-rules.md', label: 'Roo Code' },
  codebuddy: { path: 'CODEBUDDY.md', label: 'CodeBuddy' },
  amp: { path: 'AGENTS.md', label: 'Amp' },
  shai: { path: 'SHAI.md', label: 'SHAI' },
  tabnine: { path: 'TABNINE.md', label: 'Tabnine CLI' },
  'kiro-cli': { path: 'AGENTS.md', label: 'Kiro CLI' },
  agy: { path: '.agent/rules/syskit-rules.md', label: 'Antigravity' },
  bob: { path: 'AGENTS.md', label: 'IBM Bob' },
  vibe: { path: '.vibe/agents/syskit-agents.md', label: 'Mistral Vibe' },
  kimi: { path: 'KIMI.md', label: 'Kimi Code' },
  generic: { path: 'AGENTS.md', label: 'Shared Agents' }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPlanField(fieldName, planContent) {
  const pattern = new RegExp(`^\\*\\*${escapeRegex(fieldName)}\\*\\*:\\s*(.+)$`, 'm');
  const match = planContent.match(pattern);
  if (!match) return '';
  const value = match[1].trim();
  return ['NEEDS CLARIFICATION', 'N/A'].includes(value) ? '' : value;
}

function getProjectStructure(projectType) {
  if (projectType && projectType.toLowerCase().includes('web')) {
    return 'backend/\nfrontend/\ntests/';
  }
  return 'src/\ntests/';
}

function getCommandsForLanguage(language) {
  if (!language) return '# Add project-specific validation commands';
  if (language.includes('Python')) return 'pytest\nruff check .';
  if (language.includes('Rust')) return 'cargo test\ncargo clippy';
  if (language.includes('JavaScript') || language.includes('TypeScript')) return 'npm test\nnpm run lint';
  return `# Add commands for ${language}`;
}

function getLanguageConventions(language) {
  return language ? `${language}: Follow standard project conventions.` : 'General: Follow standard conventions.';
}

function ensureSection(content, heading, block) {
  if (content.includes(heading)) return content;
  return `${content.replace(/\s*$/, '')}\n\n${heading}\n${block}\n`;
}

function upsertListSection(content, heading, entries) {
  const uniqueEntries = [...new Set(entries.filter(Boolean))];
  if (uniqueEntries.length === 0) return content;

  const pattern = new RegExp(`(^## ${escapeRegex(heading.slice(3))}\\n)([\\s\\S]*?)(?=^## |$)`, 'm');
  if (!pattern.test(content)) {
    return `${content.replace(/\s*$/, '')}\n\n${heading}\n${uniqueEntries.join('\n')}\n`;
  }

  return content.replace(pattern, (_, header, body) => {
    const currentEntries = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '));
    const merged = [...new Set([...uniqueEntries, ...currentEntries])];
    return `${header}${merged.join('\n')}\n\n`;
  });
}

function validateGeneratedContent(content, targetPath) {
  const placeholders = findUnresolvedPlaceholders(content).filter((item) => !['[PROJECT_NAME]'].includes(item));
  if (placeholders.length > 0) {
    throw new Error(`Unresolved placeholders in ${targetPath}: ${placeholders.join(', ')}`);
  }
}

function buildTemplateContent(template, projectName, now, supportedLabels, language, framework, database, projectType, branch) {
  const techStack = [language, framework].filter(Boolean).join(' + ');
  const recentChange = techStack ? `- ${branch}: Added ${techStack}` : `- ${branch}: Updated project instructions`;
  let content = template
    .replace(/\[PROJECT NAME\]/g, projectName)
    .replace(/\[DATE\]/g, now)
    .replace(/\[EXTRACTED FROM ALL PLAN\.MD FILES\]/g, techStack ? `- ${techStack} (${branch})` : `- ${branch}`)
    .replace(/\[ACTUAL STRUCTURE FROM PLANS\]/g, getProjectStructure(projectType))
    .replace(/\[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES\]/g, getCommandsForLanguage(language))
    .replace(/\[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE\]/g, getLanguageConventions(language))
    .replace(/\[LAST 3 FEATURES AND WHAT THEY ADDED\]/g, recentChange);

  content = ensureSection(content, '## Supported Platforms', supportedLabels.map((item) => `- ${item}`).join('\n'));
  if (database) {
    content = upsertListSection(content, '## Active Technologies', [`- ${database} (${branch})`]);
  }
  return content;
}

function renderMdc(content) {
  if (content.startsWith('---\n')) return content;
  return `---\ndescription: Project Development Guidelines\nglobs: ["**/*"]\nalwaysApply: true\n---\n${content}`;
}

function writeAgentFile(targetPath, content) {
  ensureDir(dirname(targetPath));
  validateGeneratedContent(content, targetPath);
  writeFileSync(targetPath, targetPath.endsWith('.mdc') ? renderMdc(content) : content, 'utf8');
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(`Usage: syskit update-agent-context [OPTIONS]

OPTIONS:
  --agent-type <type>  Specific agent to update
  --branch <name>      Feature branch name
  --json               Output result in JSON format
  --help               Show this help message`);
    return;
  }

  const repoRoot = getRepoRoot();
  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const planPath = opts.branch ? join(getFeatureDir(repoRoot, branch), 'plan.md') : env.IMPL_PLAN;
  const templatePath = resolveTemplate(repoRoot, 'agent-file-template');

  if (!existsSync(planPath)) {
    console.error(`ERROR: No plan.md found at ${planPath}`);
    process.exit(1);
  }

  if (!templatePath || !existsSync(templatePath)) {
    console.error('ERROR: Template file not found at .Systematize/templates/agent-file-template.md');
    process.exit(1);
  }

  const requestedAgent = opts['agent-type'];
  if (requestedAgent && !AGENT_TARGETS[requestedAgent]) {
    console.error(`ERROR: Unknown agent type: ${requestedAgent}`);
    process.exit(1);
  }

  const planContent = readFileSync(planPath, 'utf8');
  const language = getPlanField('Language/Version', planContent);
  const framework = getPlanField('Primary Dependencies', planContent);
  const database = getPlanField('Storage', planContent);
  const projectType = getPlanField('Project Type', planContent);
  const projectName = repoRoot.split(/[\\/]/).pop() || 'Project';
  const now = new Date().toISOString().slice(0, 10);
  const templateContent = readFileSync(templatePath, 'utf8');

  const targetGroups = new Map();
  for (const [agentKey, definition] of Object.entries(AGENT_TARGETS)) {
    if (requestedAgent && agentKey !== requestedAgent) continue;
    const absolutePath = join(repoRoot, definition.path);
    if (!targetGroups.has(absolutePath)) {
      targetGroups.set(absolutePath, []);
    }
    targetGroups.get(absolutePath).push(definition.label);
  }

  if (!requestedAgent) {
    const existingGroups = new Map([...targetGroups.entries()].filter(([path]) => existsSync(path)));
    if (existingGroups.size > 0) {
      targetGroups.clear();
      for (const [path, labels] of existingGroups.entries()) {
        targetGroups.set(path, labels);
      }
    } else {
      targetGroups.clear();
      targetGroups.set(join(repoRoot, AGENT_TARGETS.claude.path), [AGENT_TARGETS.claude.label]);
    }
  }

  const created = [];
  const updated = [];

  for (const [targetPath, supportedLabels] of targetGroups.entries()) {
    const alreadyExists = existsSync(targetPath);
    const baseContent = alreadyExists ? readFileSync(targetPath, 'utf8') : templateContent;
    let content = existsSync(targetPath)
      ? ensureSection(baseContent, '## Supported Platforms', supportedLabels.map((item) => `- ${item}`).join('\n'))
      : buildTemplateContent(templateContent, projectName, now, supportedLabels, language, framework, database, projectType, branch);

    const techEntries = [];
    if (language || framework) {
      techEntries.push(`- ${[language, framework].filter(Boolean).join(' + ')} (${branch})`);
    }
    if (database) {
      techEntries.push(`- ${database} (${branch})`);
    }

    content = upsertListSection(content, '## Active Technologies', techEntries);
    content = upsertListSection(content, '## Recent Changes', [`- ${branch}: Updated agent context`]);
    content = ensureSection(content, '## Supported Platforms', supportedLabels.map((item) => `- ${item}`).join('\n'));
    content = content.replace(/(\*\*)?Last updated(\*\*)?: .*\d{4}-\d{2}-\d{2}/, `Last updated: ${now}`);

    writeAgentFile(targetPath, content);
    if (alreadyExists) updated.push(targetPath);
    else created.push(targetPath);
  }

  const result = { updated, created };
  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('✅ Agent context files updated');
    if (updated.length > 0) console.log(`  Updated: ${updated.join(', ')}`);
    if (created.length > 0) console.log(`  Created: ${created.join(', ')}`);
  }
}
