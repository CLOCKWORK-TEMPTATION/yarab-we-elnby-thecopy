import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findUnresolvedPlaceholders } from './common.mjs';

export function replaceAll(content, replacements) {
  let output = content;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
}

export function renderAgentGuidance(templateContent, projectName, supportedPlatforms, dateText) {
  const commands = [
    'PowerShell:',
    'pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json',
    '',
    'Node.js:',
    'node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json',
    '',
    'Bootstrap:',
    'pwsh -File .Systematize/scripts/powershell/init-syskit.ps1',
    'node .Systematize/scripts/node/cli.mjs init'
  ].join('\n');

  const style = [
    'Follow repository conventions and update these instructions after plan.md is created.',
    'Prefer the Systematize workflow: sys -> clarify -> constitution -> research -> plan -> tasks -> implement.'
  ].join('\n');

  const content = replaceAll(templateContent, {
    '[PROJECT NAME]': projectName,
    '[DATE]': dateText,
    '[EXTRACTED FROM ALL PLAN.MD FILES]': '- Bootstrap stage: no plan-derived technologies yet',
    '[ACTUAL STRUCTURE FROM PLANS]': 'commands/\n.Systematize/\nfeatures/',
    '[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]': commands,
    '[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]': style,
    '[LAST 3 FEATURES AND WHAT THEY ADDED]': '- bootstrap: Installed Systematize Framework'
  });

  const lines = content.split('\n');
  lines.splice(3, 0, `Supported platforms: ${supportedPlatforms.join(', ')}`, '');
  return lines.join('\n');
}

export function renderMdcGuidance(markdownContent) {
  const frontmatter = [
    '---',
    'description: Project Development Guidelines',
    'globs: ["**/*"]',
    'alwaysApply: true',
    '---',
    ''
  ].join('\n');

  return `${frontmatter}${markdownContent}`;
}

export function assertNoRuntimePlaceholders(content, targetPath) {
  const placeholders = findUnresolvedPlaceholders(content).filter((item) => item !== '[PROJECT_NAME]');
  if (placeholders.length > 0) {
    throw new Error(`Unresolved placeholders in ${targetPath}: ${placeholders.join(', ')}`);
  }
}

export function renderVsCodeTasks() {
  return JSON.stringify({
    version: '2.0.0',
    tasks: [
      {
        label: 'Syskit: Create Feature (PowerShell)',
        type: 'shell',
        command: 'pwsh',
        args: ['-File', '.Systematize/scripts/powershell/create-new-feature.ps1', 'Feature description', '-Json'],
        problemMatcher: []
      },
      {
        label: 'Syskit: Healthcheck (PowerShell)',
        type: 'shell',
        command: 'pwsh',
        args: ['-File', '.Systematize/scripts/powershell/run-healthcheck.ps1'],
        problemMatcher: []
      },
      {
        label: 'Syskit: Status (Node)',
        type: 'shell',
        command: 'node',
        args: ['.Systematize/scripts/node/cli.mjs', 'feature-status', '--json'],
        problemMatcher: []
      }
    ]
  }, null, 2);
}

export function renderVsCodeSettings() {
  return JSON.stringify({
    'files.exclude': {
      '**/.Systematize/exports': true,
      '**/.Systematize/snapshots': true
    },
    'search.exclude': {
      '**/.Systematize/exports': true,
      '**/.Systematize/snapshots': true
    }
  }, null, 2);
}

export function renderVsCodeExtensions() {
  return JSON.stringify({
    recommendations: [
      'github.copilot',
      'Continue.continue'
    ]
  }, null, 2);
}

export function loadAgentTemplate(sourceRoot) {
  const templatePath = join(sourceRoot, '.Systematize', 'templates', 'agent-file-template.md');
  return readFileSync(templatePath, 'utf8');
}
