import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getRepoRoot, getSyskitConfig } from './common.mjs';

const DEFAULT_SYSKIT_CONFIG = Object.freeze({
  schema_version: 1,
  version: '2.0',
  constitution_profile: 'standard',
  auto_healthcheck: true,
  auto_commit: false,
  auto_changelog: true,
  default_preset: null,
  alerts_enabled: true,
  export_format: 'markdown',
  analytics_enabled: true
});

const DEFAULT_ALERTS_CONFIG = Object.freeze({
  schema_version: 1,
  alerts: {
    stale_assumption: {
      enabled: true,
      description: 'Assumption open without validation',
      trigger: "ASM status = 'Pending' AND age > 7 days",
      severity: 'warning',
      action: 'warn',
      pending_status: 'Pending',
      max_age_days: 7
    },
    risk_escalation: {
      enabled: true,
      description: 'Risk probability increased',
      trigger: "RK probability changed to 'High' or 'Critical'",
      severity: 'critical',
      action: 'block',
      levels: 'High,Critical'
    },
    scope_creep: {
      enabled: true,
      description: 'Requirements count grew significantly',
      trigger: 'FR count > baseline * 1.2',
      severity: 'warning',
      action: 'review',
      growth_factor: 1.2
    },
    orphan_requirement: {
      enabled: true,
      description: 'Requirement without implementation task',
      trigger: 'FR exists without matching task',
      severity: 'high',
      action: 'warn'
    },
    stale_feature: {
      enabled: true,
      description: 'Feature with no activity',
      trigger: 'last_modified > 14 days',
      severity: 'info',
      action: 'remind',
      max_age_days: 14
    }
  }
});

const DEFAULT_EXTENSIONS_CONFIG = Object.freeze({
  schema_version: 2,
  hooks: {},
  custom_commands: []
});

function stripInlineComment(value) {
  let output = '';
  let quote = null;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if ((char === '"' || char === '\'') && value[i - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
      output += char;
      continue;
    }

    if (char === '#' && !quote && (i === 0 || /\s/.test(value[i - 1]))) {
      break;
    }

    output += char;
  }

  return output.trim();
}

function parseScalar(rawValue) {
  const value = stripInlineComment(rawValue);

  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.slice(1, -1);
  }

  return value;
}

function parseNestedYamlObject(content) {
  const result = {};
  const stack = [{ indent: -1, value: result }];

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (rawValue === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }

  return result;
}

function parseListItemObject(text) {
  const object = {};
  const itemContent = text.slice(2).trim();

  if (!itemContent) return object;

  const separator = itemContent.indexOf(':');
  if (separator === -1) {
    object.value = parseScalar(itemContent);
    return object;
  }

  const key = itemContent.slice(0, separator).trim();
  const rawValue = itemContent.slice(separator + 1).trim();
  object[key] = parseScalar(rawValue);
  return object;
}

function parseExtensionsYaml(content) {
  const config = {
    schema_version: DEFAULT_EXTENSIONS_CONFIG.schema_version,
    hooks: {},
    custom_commands: []
  };

  let section = null;
  let currentHookName = null;
  let currentItem = null;

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();

    if (indent === 0 && line === 'hooks:') {
      section = 'hooks';
      currentHookName = null;
      currentItem = null;
      continue;
    }

    if (indent === 0 && (line === 'custom_commands:' || /^custom_commands:\s*\[\]\s*$/.test(line))) {
      section = 'custom_commands';
      currentHookName = null;
      currentItem = null;
      continue;
    }

    if (indent === 0 && line.startsWith('schema_version:')) {
      config.schema_version = parseScalar(line.split(':').slice(1).join(':'));
      continue;
    }

    if (section === 'hooks') {
      if (indent === 2 && /^([^:]+):\s*\[\]\s*$/.test(line)) {
        currentHookName = line.match(/^([^:]+):/)[1].trim();
        config.hooks[currentHookName] = [];
        currentItem = null;
        continue;
      }

      if (indent === 2 && line.endsWith(':')) {
        currentHookName = line.slice(0, -1).trim();
        config.hooks[currentHookName] = [];
        currentItem = null;
        continue;
      }

      if (indent === 4 && line.startsWith('- ')) {
        currentItem = parseListItemObject(line);
        config.hooks[currentHookName].push(currentItem);
        continue;
      }

      if (indent >= 6 && currentItem) {
        const separator = line.indexOf(':');
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        const rawValue = line.slice(separator + 1).trim();
        currentItem[key] = parseScalar(rawValue);
      }

      continue;
    }

    if (section === 'custom_commands') {
      if (indent === 2 && line.startsWith('- ')) {
        currentItem = parseListItemObject(line);
        config.custom_commands.push(currentItem);
        continue;
      }

      if (indent >= 4 && currentItem) {
        const separator = line.indexOf(':');
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        const rawValue = line.slice(separator + 1).trim();
        currentItem[key] = parseScalar(rawValue);
      }
    }
  }

  return config;
}

function mergeAlertDefaults(parsed) {
  const alerts = {};
  const parsedAlerts = parsed?.alerts || {};

  for (const [alertName, defaults] of Object.entries(DEFAULT_ALERTS_CONFIG.alerts)) {
    alerts[alertName] = {
      ...defaults,
      ...(parsedAlerts[alertName] || {})
    };
  }

  return {
    schema_version: parsed?.schema_version || DEFAULT_ALERTS_CONFIG.schema_version,
    alerts
  };
}

export function getSyskitRuntimeConfig(repoRoot = getRepoRoot()) {
  const parsed = getSyskitConfig(repoRoot) || {};

  return {
    ...DEFAULT_SYSKIT_CONFIG,
    ...parsed,
    schema_version: DEFAULT_SYSKIT_CONFIG.schema_version,
    reserved_keys: ['version', 'constitution_profile', 'export_format']
  };
}

export function getAlertsConfig(repoRoot = getRepoRoot()) {
  const configPath = join(repoRoot, '.Systematize/config/alerts.yml');
  if (!existsSync(configPath)) return DEFAULT_ALERTS_CONFIG;

  const parsed = parseNestedYamlObject(readFileSync(configPath, 'utf8'));
  return mergeAlertDefaults(parsed);
}

export function getExtensionsConfig(repoRoot = getRepoRoot()) {
  const configPath = join(repoRoot, '.Systematize/config/extensions.yml');
  if (!existsSync(configPath)) return DEFAULT_EXTENSIONS_CONFIG;

  const parsed = parseExtensionsYaml(readFileSync(configPath, 'utf8'));
  return {
    schema_version: parsed.schema_version || DEFAULT_EXTENSIONS_CONFIG.schema_version,
    hooks: parsed.hooks || {},
    custom_commands: parsed.custom_commands || []
  };
}

export function loadHooks(repoRoot, hookName) {
  const extensions = getExtensionsConfig(repoRoot);
  const hooks = Array.isArray(extensions.hooks[hookName]) ? extensions.hooks[hookName] : [];

  return hooks
    .filter((hook) => hook && hook.enabled !== false)
    .map((hook) => ({
      ...hook,
      hook_name: hookName,
      optional: hook.optional === true,
      condition: hook.condition || ''
    }));
}

export function getCustomCommandMap(repoRoot = getRepoRoot()) {
  const extensions = getExtensionsConfig(repoRoot);
  const entries = {};

  for (const command of extensions.custom_commands || []) {
    if (command?.name) {
      entries[command.name] = command;
    }
  }

  return entries;
}

export function normalizeCliCommandName(commandName) {
  return String(commandName || '')
    .replace(/^syskit\./, '')
    .trim()
    .replace(/_/g, '-');
}

export function resolveHookCommand(repoRoot, hook, commands = {}) {
  const rawCommand = String(hook?.command || '').trim();
  if (!rawCommand) return { type: 'invalid', reason: 'missing_command' };

  const normalized = normalizeCliCommandName(rawCommand);
  if (commands[normalized]) {
    return { type: 'cli', command_name: normalized };
  }

  const customCommands = getCustomCommandMap(repoRoot);
  const directMatch = customCommands[rawCommand] || customCommands[`syskit.${normalized}`];
  if (directMatch) {
    return {
      type: 'manual',
      command_name: directMatch.name,
      command_file: directMatch.command_file,
      description: directMatch.description || hook.description || ''
    };
  }

  return { type: 'unknown', command_name: rawCommand };
}
