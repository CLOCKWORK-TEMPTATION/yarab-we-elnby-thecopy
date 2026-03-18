#!/usr/bin/env node

import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { exportChangelogEntry, getCurrentBranch, getFeatureDir, getRepoRoot, hasGit, parseArgs } from './lib/common.mjs';
import { getCustomCommandMap, getSyskitRuntimeConfig, loadHooks, normalizeCliCommandName, resolveHookCommand } from './lib/configuration.mjs';
import { evaluateFeatureHealth } from './lib/health.mjs';

const COMMANDS = {
  init: () => import('./lib/init-syskit.mjs'),
  'create-feature': () => import('./lib/create-feature.mjs'),
  'check-prerequisites': () => import('./lib/check-prerequisites.mjs'),
  snapshot: () => import('./lib/snapshot-artifacts.mjs'),
  healthcheck: () => import('./lib/run-healthcheck.mjs'),
  'export-dashboard': () => import('./lib/export-dashboard.mjs'),
  'check-alerts': () => import('./lib/check-alerts.mjs'),
  'feature-status': () => import('./lib/get-feature-status.mjs'),
  'auto-commit': () => import('./lib/auto-commit.mjs'),
  'generate-pr': () => import('./lib/generate-pr.mjs'),
  'record-analytics': () => import('./lib/record-analytics.mjs'),
  'update-sync-state': () => import('./lib/update-sync-state.mjs'),
  'generate-constitution': () => import('./lib/generate-constitution.mjs'),
  'update-agent-context': () => import('./lib/update-agent-context.mjs'),
  'setup-plan': () => import('./lib/setup-plan.mjs'),
  'setup-research': () => import('./lib/setup-research.mjs'),
  'setup-tasks': () => import('./lib/setup-tasks.mjs')
};

const MUTATING_COMMANDS = new Set([
  'init',
  'create-feature',
  'snapshot',
  'generate-pr',
  'record-analytics',
  'update-sync-state',
  'generate-constitution',
  'update-agent-context',
  'setup-plan',
  'setup-research',
  'setup-tasks'
]);

const VALIDATION_COMMANDS = new Set(['check-prerequisites', 'healthcheck', 'check-alerts', 'feature-status']);

class CommandExitError extends Error {
  constructor(code = 0) {
    super(`Command exited with code ${code}`);
    this.name = 'CommandExitError';
    this.code = code;
  }
}

function getTrackedMarkdownFiles(repoRoot, branch) {
  const featureDir = getFeatureDir(repoRoot, branch);
  return [
    join(featureDir, 'sys.md'),
    join(featureDir, 'research.md'),
    join(featureDir, 'plan.md'),
    join(featureDir, 'tasks.md'),
    join(featureDir, 'quickstart.md'),
    join(featureDir, 'AGENTS.md'),
    join(repoRoot, '.Systematize', 'memory', 'constitution.md')
  ];
}

function captureFileTimes(paths) {
  return Object.fromEntries(
    paths
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => [filePath, statSync(filePath).mtimeMs])
  );
}

function detectChangedMarkdownFiles(before, paths) {
  return paths.filter((filePath) => existsSync(filePath) && statSync(filePath).mtimeMs !== before[filePath]);
}

function buildHelpText(version, customCommands) {
  const lines = [
    '',
    `Systematize KIT CLI v${version}`,
    '',
    'الاستخدام:',
    '  node cli.mjs <command> [options]',
    '',
    'الأوامر المتاحة:',
    '  init                  تهيئة Systematize KIT داخل المستودع الحالي',
    '  create-feature        إنشاء feature جديد',
    '  check-prerequisites   فحص المتطلبات',
    '  snapshot              حفظ نسخة احتياطية من الوثائق',
    '  healthcheck           فحص صحة الوثائق',
    '  export-dashboard      تصدير HTML dashboard',
    '  check-alerts          فحص التنبيهات',
    '  feature-status        عرض حالة feature',
    '  auto-commit           Auto-commit بعد التعديل',
    '  generate-pr           توليد PR template',
    '  record-analytics      تسجيل بيانات تحليلية',
    '  update-sync-state     تحديث حالة المزامنة',
    '  generate-constitution إنشاء constitution من القالب',
    '  update-agent-context  تحديث ملفات agent context',
    '  setup-plan            تهيئة خطة التنفيذ',
    '  setup-research        تهيئة البحث',
    '  setup-tasks           تهيئة قائمة المهام'
  ];

  const customEntries = Object.values(customCommands);
  if (customEntries.length > 0) {
    lines.push('', 'أوامر التوسعات المسجلة:');
    for (const command of customEntries) {
      lines.push(`  ${command.name.padEnd(21)} ${command.description || 'أمر توسعة مخصص'}`);
    }
  }

  lines.push(
    '',
    'خيارات عامة:',
    '  --json                إخراج JSON',
    '  --help, -h            عرض المساعدة',
    '  --branch <name>       تحديد feature branch',
    ''
  );

  return lines.join('\n');
}

async function executeModule(commandName, commandArgs, options = {}) {
  const originalExit = process.exit;
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  process.exit = (code = 0) => {
    throw new CommandExitError(code);
  };

  if (options.quiet) {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }

  try {
    const moduleRef = await COMMANDS[commandName]();
    await moduleRef.default(commandArgs);
    return 0;
  } catch (error) {
    if (error instanceof CommandExitError) return error.code;
    throw error;
  } finally {
    process.exit = originalExit;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
}

async function recordAnalyticsEvent(commandName, status, branch, details) {
  if (commandName === 'record-analytics') return;

  const payload = JSON.stringify({
    command: commandName,
    status,
    ...details
  });

  await executeModule('record-analytics', ['--branch', branch, '--event', 'command_lifecycle', '--data', payload, '--json'], { quiet: true });
}

async function recordAnalyticsPayload(eventType, branch, details = {}) {
  const args = ['--branch', branch, '--event', eventType];
  if (Object.keys(details).length > 0) {
    args.push('--data', JSON.stringify(details));
  }
  args.push('--json');
  await executeModule('record-analytics', args, { quiet: true });
}

async function runAutoCommit(commandName, branch, jsonMode) {
  if (jsonMode) return;
  await executeModule('auto-commit', ['--command', commandName, '--branch', branch]);
}

function runAutoHealthcheck(repoRoot, branch, jsonMode) {
  if (jsonMode) return null;

  const featureDir = getFeatureDir(repoRoot, branch);
  if (!existsSync(featureDir)) return null;

  return evaluateFeatureHealth(featureDir);
}

function applyAutoChangelog(changedFiles, commandName) {
  for (const filePath of changedFiles) {
    exportChangelogEntry(filePath, {
      change: `${commandName} completed`,
      author: 'systematize-cli'
    });
  }
}

async function executeHooks(hookName, context, options = {}) {
  const hooks = loadHooks(context.repoRoot, hookName);
  const results = [];

  for (const hook of hooks) {
    if (hook.condition) {
      results.push({ hook: hook.extension || hook.command, status: 'skipped_condition' });
      continue;
    }

    const resolution = resolveHookCommand(context.repoRoot, hook, COMMANDS);
    if (resolution.type === 'cli') {
      const exitCode = await executeModule(resolution.command_name, ['--branch', context.branch].filter(Boolean));
      results.push({ hook: hook.extension || hook.command, status: exitCode === 0 ? 'executed' : 'failed', exit_code: exitCode });
      if (exitCode !== 0 && !hook.optional) {
        throw new Error(`Mandatory hook failed: ${hook.command}`);
      }
      continue;
    }

    if (resolution.type === 'manual') {
      const message = `Extension hook requires manual execution: ${resolution.command_name} (${resolution.command_file})`;
      if (!options.quiet) console.warn(`⚠️ ${message}`);
      results.push({ hook: hook.extension || hook.command, status: hook.optional ? 'manual_optional' : 'manual_required', command_file: resolution.command_file });
      if (!hook.optional) {
        throw new Error(message);
      }
      continue;
    }

    const unknownMessage = `Unknown hook command: ${hook.command}`;
    if (!options.quiet) console.warn(`⚠️ ${unknownMessage}`);
    results.push({ hook: hook.extension || hook.command, status: hook.optional ? 'unknown_optional' : 'unknown_required' });
    if (!hook.optional) {
      throw new Error(unknownMessage);
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const command = normalizeCliCommandName(args[0] || '');
  const repoRoot = getRepoRoot();
  const runtimeConfig = getSyskitRuntimeConfig(repoRoot);
  const customCommands = getCustomCommandMap(repoRoot);
  const branch = parseArgs(args.slice(1)).branch || getCurrentBranch();

  if (!command || command === '--help' || command === '-h') {
    console.log(buildHelpText(runtimeConfig.version, customCommands));
    process.exit(0);
  }

  const extensionCommand = customCommands[args[0]] || customCommands[`syskit.${command}`];
  if (!COMMANDS[command]) {
    if (extensionCommand) {
      if (runtimeConfig.analytics_enabled) {
        try {
          await recordAnalyticsPayload('custom_command_used', branch, {
            command: extensionCommand.name,
            command_file: extensionCommand.command_file || null
          });
        } catch {
          // Ignore analytics failures for manual extension commands.
        }
      }

      console.log(`Extension command registered: ${extensionCommand.name}`);
      console.log(`Definition: ${extensionCommand.command_file}`);
      console.log(`Description: ${extensionCommand.description || 'N/A'}`);
      console.log('Execution mode: AI/manual command definition');
      process.exit(0);
    }

    console.error(`❌ أمر غير معروف: ${args[0]}`);
    console.error('استخدم --help لعرض الأوامر المتاحة');
    process.exit(1);
  }

  const commandArgs = args.slice(1);
  const parsedArgs = parseArgs(commandArgs);
  const jsonMode = parsedArgs.json === true;
  const trackedFiles = getTrackedMarkdownFiles(repoRoot, branch);
  const beforeTimes = captureFileTimes(trackedFiles);
  const lifecycleContext = { repoRoot, branch, command };

  if (parsedArgs.help) {
    const exitCode = await executeModule(command, commandArgs);
    process.exit(exitCode);
  }

  try {
    const beforeHookResults = await executeHooks(`before_${command.replace(/-/g, '_')}`, lifecycleContext, { quiet: jsonMode });
    if (runtimeConfig.analytics_enabled) {
      for (const result of beforeHookResults) {
        await recordAnalyticsPayload('hook_executed', branch, {
          hook_name: `before_${command.replace(/-/g, '_')}`,
          hook: result.hook,
          status: result.status,
          exit_code: result.exit_code || null,
          command_file: result.command_file || null
        });
      }
    }

    const exitCode = await executeModule(command, commandArgs);
    if (exitCode !== 0) {
      if (runtimeConfig.analytics_enabled) {
        await recordAnalyticsEvent(command, 'failed', branch, { exit_code: exitCode });
      }

      if (VALIDATION_COMMANDS.has(command)) {
        const validationHookResults = await executeHooks('on_validation_fail', lifecycleContext, { quiet: jsonMode });
        if (runtimeConfig.analytics_enabled) {
          for (const result of validationHookResults) {
            await recordAnalyticsPayload('hook_executed', branch, {
              hook_name: 'on_validation_fail',
              hook: result.hook,
              status: result.status,
              exit_code: result.exit_code || null,
              command_file: result.command_file || null
            });
          }
        }
      }

      const errorHookResults = await executeHooks('on_error', lifecycleContext, { quiet: jsonMode });
      if (runtimeConfig.analytics_enabled) {
        for (const result of errorHookResults) {
          await recordAnalyticsPayload('hook_executed', branch, {
            hook_name: 'on_error',
            hook: result.hook,
            status: result.status,
            exit_code: result.exit_code || null,
            command_file: result.command_file || null
          });
        }
      }
      process.exit(exitCode);
    }

    const afterHookResults = await executeHooks(`after_${command.replace(/-/g, '_')}`, lifecycleContext, { quiet: jsonMode });
    if (runtimeConfig.analytics_enabled) {
      for (const result of afterHookResults) {
        await recordAnalyticsPayload('hook_executed', branch, {
          hook_name: `after_${command.replace(/-/g, '_')}`,
          hook: result.hook,
          status: result.status,
          exit_code: result.exit_code || null,
          command_file: result.command_file || null
        });
      }
    }

    if (runtimeConfig.analytics_enabled) {
      await recordAnalyticsEvent(command, 'completed', branch, { has_git: hasGit() });
    }

    if (MUTATING_COMMANDS.has(command)) {
      const changedFiles = detectChangedMarkdownFiles(beforeTimes, trackedFiles);

      if (runtimeConfig.auto_changelog) {
        applyAutoChangelog(changedFiles, command);
      }

      if (runtimeConfig.auto_healthcheck) {
        const healthReport = runAutoHealthcheck(repoRoot, branch, jsonMode);
        if (healthReport && !jsonMode) {
          console.log(`ℹ️ Health after ${command}: ${healthReport.score}/${healthReport.maxScore}`);
        }
      }

      if (runtimeConfig.auto_commit && hasGit()) {
        await runAutoCommit(command, branch, jsonMode);
      }
    }
  } catch (error) {
    if (runtimeConfig.analytics_enabled) {
      await recordAnalyticsEvent(command, 'error', branch, { message: error.message });
    }

    try {
      const errorHookResults = await executeHooks('on_error', lifecycleContext, { quiet: jsonMode });
      if (runtimeConfig.analytics_enabled) {
        for (const result of errorHookResults) {
          await recordAnalyticsPayload('hook_executed', branch, {
            hook_name: 'on_error',
            hook: result.hook,
            status: result.status,
            exit_code: result.exit_code || null,
            command_file: result.command_file || null
          });
        }
      }
    } catch {
      // Ignore hook errors while reporting the primary failure.
    }

    console.error(`❌ خطأ في تنفيذ ${command}: ${error.message}`);
    process.exit(1);
  }
}

await main();
