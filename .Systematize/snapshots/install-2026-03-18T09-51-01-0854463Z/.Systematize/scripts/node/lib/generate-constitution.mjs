// إنشاء constitution من القالب — مكافئ generate-constitution.ps1
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { getRepoRoot, parseArgs, resolveTemplate, ensureDir } from './common.mjs';

export default async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: syskit generate-constitution [OPTIONS]

Generate a project constitution from the constitution template.

OPTIONS:
  --project-name <name>    Project name (defaults to repo folder name)
  --version <ver>          Constitution version (default: 1.0.0)
  --owner <name>           Project owner name
  --pm <name>              Product manager name
  --tech-lead <name>       Technical lead name
  --description <text>     Short project description
  --force                  Overwrite existing constitution without prompting
  --json                   Output result in JSON format
  --help                   Show this help message

EXAMPLES:
  node cli.mjs generate-constitution --project-name "My Platform"
  node cli.mjs generate-constitution --project-name "My Platform" --version "1.0.0" --owner "Team Lead"

OUTPUT:
  Creates .Systematize/memory/constitution.md from the constitution template
  with project-specific placeholders filled in.`);
    return;
  }

  const repoRoot = getRepoRoot();

  // Default project name to repo folder name
  let projectName = opts['project-name'];
  if (!projectName) {
    const parts = repoRoot.split('/');
    projectName = parts[parts.length - 1] || 'Project';
  }

  const version = opts.version || '1.0.0';
  const owner = opts.owner || null;
  const pm = opts.pm || null;
  const techLead = opts['tech-lead'] || null;
  const description = opts.description || null;
  const force = opts.force || false;

  // Resolve the constitution template using the priority stack
  const templatePath = resolveTemplate(repoRoot, 'constitution-template');

  if (!templatePath || !existsSync(templatePath)) {
    console.error('ERROR: Constitution template not found. Expected at .Systematize/templates/constitution-template.md');
    console.error("Run 'node .Systematize/scripts/node/cli.mjs init' or 'pwsh -File .Systematize/scripts/powershell/init-syskit.ps1' to scaffold .Systematize/templates, or create constitution-template.md manually.");
    process.exit(1);
  }

  // Target output path
  const memoryDir = join(repoRoot, '.Systematize/memory');
  const outputFile = join(memoryDir, 'constitution.md');

  // Check if output already exists
  if (existsSync(outputFile) && !force) {
    const existingContent = readFileSync(outputFile, 'utf8');
    // Check if it's not just the raw template (has actual project data)
    if (!existingContent.includes('[PROJECT_NAME]')) {
      if (opts.json) {
        console.log(JSON.stringify({
          status: 'skipped',
          outputFile,
          reason: 'Constitution already exists with project data. Use --force to overwrite.'
        }, null, 2));
      } else {
        console.log('ℹ️ Constitution already exists at', outputFile);
        console.log('Use --force to overwrite.');
      }
      return;
    }
  }

  // Ensure memory directory exists
  ensureDir(memoryDir);

  // Read template content
  let content = readFileSync(templatePath, 'utf8');

  // Prepare date
  const today = new Date().toISOString().split('T')[0];

  // Replace placeholders
  const replacements = {
    '[PROJECT_NAME]': projectName,
    '[CONSTITUTION_VERSION]': version,
    '[CONSTITUTION_DATE]': today,
    '[LAST_AMENDED_DATE]': today,
    '[PROJECT_DESCRIPTION]': description || '[PROJECT_DESCRIPTION]',
    '[PROJECT_OWNER]': owner || '[PROJECT_OWNER]',
    '[PRODUCT_MANAGER]': pm || '[PRODUCT_MANAGER]',
    '[TECH_LEAD]': techLead || '[TECH_LEAD]'
  };

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  // Write output
  writeFileSync(outputFile, content, 'utf8');

  // Count sections filled vs placeholder
  const totalPlaceholders = (content.match(/\[[A-Z_]{3,}\]/g) || []).length;
  const totalSections = (content.match(/^## /gm) || []).length;

  // Output results
  if (opts.json) {
    console.log(JSON.stringify({
      status: 'generated',
      outputFile,
      templatePath,
      projectName,
      version,
      date: today,
      totalSections,
      remainingPlaceholders: totalPlaceholders
    }, null, 2));
  } else {
    console.log('=== Constitution Generated ===');
    console.log(`  Template:     ${templatePath}`);
    console.log(`  Output:       ${outputFile}`);
    console.log(`  Project:      ${projectName}`);
    console.log(`  Version:      ${version}`);
    console.log(`  Date:         ${today}`);
    console.log(`  Sections:     ${totalSections}`);
    console.log(`  Placeholders: ${totalPlaceholders} remaining`);
    console.log('');
    if (totalPlaceholders > 0) {
      console.log(`Next step: Open ${outputFile} and fill in the remaining [${totalPlaceholders}] placeholders.`);
      console.log('Sections to prioritize (minimum viable constitution):');
      console.log('  1. Section 7  - Project identity and problem definition');
      console.log('  2. Section 8  - Stakeholders and governance');
      console.log('  3. Section 9  - User requests registry');
      console.log('  4. Section 11 - Functional requirements');
      console.log('  5. Section 12 - Non-functional requirements');
      console.log('  6. Section 13 - Business rules');
      console.log('  7. Section 22 - Risk registry');
      console.log('  8. Section 26 - Traceability matrix');
      console.log('  9. Section 27 - Completion checklist');
    } else {
      console.log('All placeholders filled. Constitution is ready for review.');
    }
  }
}
