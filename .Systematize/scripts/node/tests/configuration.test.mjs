import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  getAlertsConfig,
  getCustomCommandMap,
  getExtensionsConfig,
  getSyskitRuntimeConfig,
  loadHooks,
  resolveHookCommand
} from '../lib/configuration.mjs';

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
    assert.equal(runtimeConfig.default_preset, 'web-fullstack');
    assert.deepEqual(runtimeConfig.reserved_keys, ['version', 'constitution_profile', 'export_format']);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
