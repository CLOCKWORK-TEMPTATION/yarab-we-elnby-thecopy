import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getAvailableExtensionPackages,
  getAlertsConfig,
  getCustomCommandMap,
  getExtensionsConfig,
  getInstalledExtensions,
  getOptionalCapabilityFlags,
  getOptionalCapabilityInstallState,
  getSyskitRuntimeConfig,
  isOptionalCapabilityEnabled,
  loadHooks,
  resolveHookCommand
} from '../lib/configuration.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function createTempRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'syskit-config-test-'));
  mkdirSync(join(repoRoot, '.Systematize', 'config'), { recursive: true });
  return repoRoot;
}

test('parses extension hooks with inline empty arrays and custom commands', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'extensions.yml'),
      `schema_version: 2

hooks:
  before_plan: []
  after_plan:
    - command: "setup-tasks"
      enabled: true
      optional: false
  after_tasks:
    - command: "syskit.review"
      enabled: true
      optional: true

custom_commands:
  - name: "syskit.review"
    command_file: ".Systematize/extensions/commands/review.md"
    description: "Run peer review checklist"
`,
      'utf8'
    );

    const config = getExtensionsConfig(repoRoot);
    assert.deepEqual(config.hooks.before_plan, []);
    assert.equal(config.hooks.after_plan.length, 1);
    assert.equal(config.custom_commands.length, 1);

    const hookResults = loadHooks(repoRoot, 'after_plan');
    assert.equal(hookResults.length, 1);
    assert.equal(hookResults[0].command, 'setup-tasks');

    const customCommandMap = getCustomCommandMap(repoRoot);
    assert.equal(customCommandMap['syskit.review'].command_file, '.Systematize/extensions/commands/review.md');

    const resolution = resolveHookCommand(
      repoRoot,
      { command: 'syskit.review' },
      { 'setup-tasks': async () => {} }
    );
    assert.equal(resolution.type, 'manual');
    assert.equal(resolution.command_name, 'syskit.review');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('merges alerts configuration overrides with defaults', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'alerts.yml'),
      `schema_version: 1

alerts:
  stale_feature:
    enabled: false
    max_age_days: 30
  scope_creep:
    growth_factor: 1.5
`,
      'utf8'
    );

    const alerts = getAlertsConfig(repoRoot);
    assert.equal(alerts.alerts.stale_feature.enabled, false);
    assert.equal(alerts.alerts.stale_feature.max_age_days, 30);
    assert.equal(alerts.alerts.scope_creep.growth_factor, 1.5);
    assert.equal(alerts.alerts.orphan_requirement.enabled, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('merges runtime config values with defaults', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'),
      `schema_version: 1
version: "2.1"
auto_commit: true
alerts_enabled: false
default_preset: "web-fullstack"
`,
      'utf8'
    );

    const runtimeConfig = getSyskitRuntimeConfig(repoRoot);
    assert.equal(runtimeConfig.version, '2.1');
    assert.equal(runtimeConfig.auto_commit, true);
    assert.equal(runtimeConfig.alerts_enabled, false);
    assert.equal(runtimeConfig.export_enabled, true);
    assert.equal(runtimeConfig.default_preset, 'web-fullstack');
    assert.deepEqual(runtimeConfig.reserved_keys, ['version', 'constitution_profile', 'export_format']);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('exposes optional capability flags from runtime config', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'),
      `schema_version: 1
alerts_enabled: false
analytics_enabled: true
export_enabled: false
taskstoissues_enabled: true
`,
      'utf8'
    );

    const flags = getOptionalCapabilityFlags(repoRoot);
    assert.deepEqual(flags, {
      alerts: false,
      analytics: true,
      export: false,
      taskstoissues: true
    });
    assert.equal(isOptionalCapabilityEnabled('export', repoRoot), false);
    assert.equal(isOptionalCapabilityEnabled('taskstoissues', repoRoot), true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('merges installed extension manifests and gates capability enablement by installation state', () => {
  const repoRoot = createTempRepo();

  try {
    mkdirSync(join(repoRoot, '.Systematize', 'extension-packages', 'export'), { recursive: true });
    mkdirSync(join(repoRoot, '.Systematize', 'extensions', 'export'), { recursive: true });

    const manifest = {
      schema_version: 1,
      name: 'export',
      capability: 'export',
      install_by_default: true,
      runtime_flags: ['export_enabled'],
      hooks: {
        after_export: [
          {
            command: 'syskit.export-review',
            enabled: true,
            optional: true
          }
        ]
      },
      custom_commands: [
        {
          name: 'syskit.export-review',
          command_file: '.Systematize/extensions/export/commands/export-review.md',
          description: 'Review exported artifacts'
        }
      ]
    };

    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'),
      `schema_version: 1
export_enabled: true
`,
      'utf8'
    );
    writeFileSync(
      join(repoRoot, '.Systematize', 'extension-packages', 'export', 'extension.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, '.Systematize', 'extensions', 'export', 'extension.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    const installState = getOptionalCapabilityInstallState(repoRoot);
    assert.deepEqual(installState.export, {
      available: true,
      installed: true,
      extension: 'export'
    });
    assert.equal(getAvailableExtensionPackages(repoRoot).length, 1);
    assert.equal(getInstalledExtensions(repoRoot).length, 1);
    assert.equal(isOptionalCapabilityEnabled('export', repoRoot), true);

    const extensionsConfig = getExtensionsConfig(repoRoot);
    assert.equal(extensionsConfig.custom_commands.length, 1);
    assert.equal(loadHooks(repoRoot, 'after_export').length, 1);
    assert.equal(getCustomCommandMap(repoRoot)['syskit.export-review'].command_file, '.Systematize/extensions/export/commands/export-review.md');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('strips inline comments from scalar values in syskit config', () => {
  const repoRoot = createTempRepo();

  try {
    writeFileSync(
      join(repoRoot, '.Systematize', 'config', 'syskit-config.yml'),
      `schema_version: 1
version: "2.0"   # metadata only
auto_healthcheck: true
`,
      'utf8'
    );

    const runtimeConfig = getSyskitRuntimeConfig(repoRoot);
    assert.equal(runtimeConfig.version, '2.0');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('checked-in review extension bridge points to the canonical command surface', () => {
  const bridgePath = join(repoRoot, '.Systematize', 'extensions', 'commands', 'review.md');
  const commandPath = join(repoRoot, 'commands', 'syskit.review.md');

  assert.equal(existsSync(commandPath), true);
  assert.equal(existsSync(bridgePath), true);
  assert.match(readFileSync(bridgePath, 'utf8'), /commands\/syskit\.review\.md/);
  assert.match(readFileSync(bridgePath, 'utf8'), /setup-review/);
});
