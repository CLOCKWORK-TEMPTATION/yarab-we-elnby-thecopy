// تسجيل تحليلات — مكافئ record-analytics.ps1
import { join } from 'path';
import { getFeaturePathsEnv, parseArgs, readJsonFile, writeJsonFile } from './common.mjs';
import { getSyskitRuntimeConfig } from './configuration.mjs';

function normalizeAnalyticsState(rawState) {
  const base = rawState || {};
  const features = {};

  if (Array.isArray(base.features)) {
    for (const feature of base.features) {
      if (feature?.branch) {
        features[feature.branch] = {
          created_at: feature.created_at || new Date().toISOString(),
          events: Array.isArray(feature.events) ? feature.events : [],
          phases: feature.phases || {}
        };
      }
    }
  } else if (base.features && typeof base.features === 'object') {
    for (const [branch, feature] of Object.entries(base.features)) {
      features[branch] = {
        created_at: feature?.created_at || new Date().toISOString(),
        events: Array.isArray(feature?.events) ? feature.events : [],
        phases: feature?.phases || {}
      };
    }
  }

  return {
    schema_version: 1,
    features,
    extensions: {
      hooks_executed: Array.isArray(base.extensions?.hooks_executed) ? base.extensions.hooks_executed : [],
      custom_commands_used: Array.isArray(base.extensions?.custom_commands_used) ? base.extensions.custom_commands_used : []
    }
  };
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: syskit record-analytics [--branch <name>] [--event <type>] [--data <json-string>] [--json]');
    return;
  }

  const env = getFeaturePathsEnv();
  const runtimeConfig = getSyskitRuntimeConfig(env.REPO_ROOT);
  const branch = opts.branch || env.CURRENT_BRANCH;
  const analyticsPath = join(env.REPO_ROOT, '.Systematize/memory/analytics.json');

  if (runtimeConfig.analytics_enabled === false && opts.event !== 'analytics_override') {
    const skipped = { branch, event: opts.event || null, recorded: false, reason: 'Analytics disabled in configuration' };
    if (opts.json) console.log(JSON.stringify(skipped, null, 2));
    else console.log('ℹ️ Analytics disabled in configuration');
    return;
  }

  const analytics = normalizeAnalyticsState(readJsonFile(analyticsPath));
  if (!analytics.features[branch]) {
    analytics.features[branch] = {
      created_at: new Date().toISOString(),
      events: [],
      phases: {}
    };
  }

  let parsedData = null;
  if (opts.data) {
    try {
      parsedData = JSON.parse(opts.data);
    } catch {
      parsedData = { raw: opts.data };
    }
  }

  if (opts.event) {
    const event = {
      type: opts.event,
      timestamp: new Date().toISOString(),
      ...(parsedData || {})
    };
    analytics.features[branch].events.push(event);

    if (opts.event === 'phase_completed' && parsedData?.phase) {
      analytics.features[branch].phases[parsedData.phase] = {
        completed_at: event.timestamp,
        duration_hours: parsedData.duration || null
      };
    }

    if (opts.event === 'hook_executed') {
      analytics.extensions.hooks_executed.push({
        branch,
        timestamp: event.timestamp,
        command: parsedData?.command || null,
        status: parsedData?.status || 'executed'
      });
    }

    if (opts.event === 'custom_command_used') {
      analytics.extensions.custom_commands_used.push({
        branch,
        timestamp: event.timestamp,
        command: parsedData?.command || null
      });
    }
  }

  writeJsonFile(analyticsPath, analytics);

  const result = {
    branch,
    event: opts.event || null,
    recorded: true,
    data: parsedData
  };

  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else console.log(`✅ ${opts.event ? `Event '${opts.event}' recorded` : `Feature '${branch}' tracked in analytics`}`);
}
