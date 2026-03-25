import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getRepoRoot, getSyskitConfig } from './common.mjs';
import { parseNestedYamlObject, parseScalar } from './config-parser.mjs';

const DEFAULT_SYSKIT_CONFIG = Object.freeze({
  schema_version: 1,
  version: '2.0',
  constitution_profile: 'standard',
  auto_healthcheck: true,
  auto_commit: false,
  auto_changelog: true,
  default_preset: null,
  alerts_enabled: true,
  export_enabled: true,
  export_format: 'markdown',
  analytics_enabled: true,
  taskstoissues_enabled: false
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
  custom_commands: [],
  installed_extensions: []
});

const LEGACY_EXTENSION_ENTRIES = new Set(['commands', 'templates']);

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

function readExtensionManifests(rootDir) {
  if (!existsSync(rootDir)) return [];

  const manifests = [];
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (LEGACY_EXTENSION_ENTRIES.has(entry.name)) continue;

    const manifestPath = join(rootDir, entry.name, 'extension.json');
    if (!existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      manifests.push({
        ...manifest,
        name: manifest.name || entry.name,
        package_dir: entry.name,
        manifest_path: manifestPath
      });
    } catch {
      // Ignore malformed manifests so one broken extension does not break the core.
    }
  }

  return manifests;
}

function mergeExtensionDeclarations(baseConfig, manifests) {
  const merged = {
    schema_version: baseConfig.schema_version || DEFAULT_EXTENSIONS_CONFIG.schema_version,
    hooks: { ...(baseConfig.hooks || {}) },
    custom_commands: [...(baseConfig.custom_commands || [])],
    installed_extensions: manifests.map(({ manifest_path, ...manifest }) => manifest)
  };

  const customCommandNames = new Set(
    merged.custom_commands
      .map((item) => item?.name)
      .filter(Boolean)
  );

  for (const manifest of manifests) {
    for (const [hookName, hookList] of Object.entries(manifest.hooks || {})) {
      if (!Array.isArray(hookList)) continue;
      merged.hooks[hookName] = [...(merged.hooks[hookName] || []), ...hookList];
    }

    for (const command of manifest.custom_commands || []) {
      if (!command?.name || customCommandNames.has(command.name)) continue;
      merged.custom_commands.push(command);
      customCommandNames.add(command.name);
    }
  }

  return merged;
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

export function getOptionalCapabilityFlags(repoRoot = getRepoRoot()) {
  const runtimeConfig = getSyskitRuntimeConfig(repoRoot);
  return {
    alerts: runtimeConfig.alerts_enabled !== false,
    analytics: runtimeConfig.analytics_enabled !== false,
    export: runtimeConfig.export_enabled !== false,
    taskstoissues: runtimeConfig.taskstoissues_enabled === true
  };
}

export function getInstalledExtensions(repoRoot = getRepoRoot()) {
  return readExtensionManifests(join(repoRoot, '.Systematize', 'extensions'));
}

export function getAvailableExtensionPackages(repoRoot = getRepoRoot()) {
  return readExtensionManifests(join(repoRoot, '.Systematize', 'extension-packages'));
}

export function getOptionalCapabilityInstallState(repoRoot = getRepoRoot()) {
  const availablePackages = getAvailableExtensionPackages(repoRoot);
  const installedExtensions = getInstalledExtensions(repoRoot);
  const installedByName = new Set(installedExtensions.map((item) => item.name));
  const state = {};

  for (const manifest of availablePackages) {
    const capabilityName = manifest.capability || manifest.name;
    if (!capabilityName) continue;

    state[capabilityName] = {
      available: true,
      installed: installedByName.has(manifest.name),
      extension: manifest.name
    };
  }

  return state;
}

export function isOptionalCapabilityEnabled(capabilityName, repoRoot = getRepoRoot()) {
  const flags = getOptionalCapabilityFlags(repoRoot);
  const installState = getOptionalCapabilityInstallState(repoRoot);

  if (installState[capabilityName]) {
    return flags[capabilityName] === true && installState[capabilityName].installed === true;
  }

  return flags[capabilityName] === true;
}

export function getAlertsConfig(repoRoot = getRepoRoot()) {
  const configPath = join(repoRoot, '.Systematize/config/alerts.yml');
  if (!existsSync(configPath)) return DEFAULT_ALERTS_CONFIG;

  const parsed = parseNestedYamlObject(readFileSync(configPath, 'utf8'));
  return mergeAlertDefaults(parsed);
}

export function getExtensionsConfig(repoRoot = getRepoRoot()) {
  const configPath = join(repoRoot, '.Systematize/config/extensions.yml');
  const parsed = existsSync(configPath)
    ? parseExtensionsYaml(readFileSync(configPath, 'utf8'))
    : DEFAULT_EXTENSIONS_CONFIG;
  const installedExtensions = getInstalledExtensions(repoRoot);

  return mergeExtensionDeclarations({
    schema_version: parsed.schema_version || DEFAULT_EXTENSIONS_CONFIG.schema_version,
    hooks: parsed.hooks || {},
    custom_commands: parsed.custom_commands || []
  }, installedExtensions);
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
