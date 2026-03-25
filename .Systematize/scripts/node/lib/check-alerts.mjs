// فحص التنبيهات — مكافئ check-alerts.ps1
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getFeatureDir, getFeaturePathsEnv, parseArgs, readJsonFile } from './common.mjs';
import { getAlertsConfig, isOptionalCapabilityEnabled } from './configuration.mjs';

function readFileOrEmpty(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

export default async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: syskit check-alerts [--branch <name>] [--severity <level>] [--json]');
    return;
  }

  const env = getFeaturePathsEnv();
  const branch = opts.branch || env.CURRENT_BRANCH;
  const featureDir = opts.branch ? getFeatureDir(env.REPO_ROOT, opts.branch) : env.FEATURE_DIR;
  const alertsConfig = getAlertsConfig(env.REPO_ROOT);

  if (!isOptionalCapabilityEnabled('alerts', env.REPO_ROOT)) {
    const result = { branch, alerts: [], hasBlocking: false, totalAlerts: 0, message: 'Alerts disabled in configuration' };
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`ℹ️ Alerts disabled for ${branch}`);
    return;
  }

  const sys = readFileOrEmpty(join(featureDir, 'sys.md'));
  const tasks = readFileOrEmpty(join(featureDir, 'tasks.md'));
  const research = readFileOrEmpty(join(featureDir, 'research.md'));
  const alerts = [];
  const getAlert = (name) => ({ name, ...(alertsConfig.alerts[name] || {}) });
  const isEnabled = (name) => getAlert(name).enabled !== false;
  const frIds = [...new Set(sys.match(/FR-\d{3}/g) || [])];

  if (isEnabled('orphan_requirement') && tasks) {
    const alert = getAlert('orphan_requirement');
    const referencedFrIds = [...new Set(tasks.match(/FR-\d{3}/g) || [])];
    const orphaned = frIds.filter((item) => !referencedFrIds.includes(item));
    if (orphaned.length > 0) {
      alerts.push({
        name: 'orphan_requirement',
        severity: alert.severity || 'high',
        action: alert.action || 'warn',
        message: `FRs without tasks: ${orphaned.join(', ')}`,
        details: orphaned
      });
    }
  }

  if (isEnabled('scope_creep')) {
    const alert = getAlert('scope_creep');
    const factor = Number(alert.growth_factor || 1.2);
    const syncStatePath = join(env.REPO_ROOT, '.Systematize/memory/sync-state.json');
    const syncState = existsSync(syncStatePath) ? readJsonFile(syncStatePath) : null;
    const featureState = syncState?.features?.[branch];
    if (featureState?.baseline_fr_count) {
      const baseline = Number(featureState.baseline_fr_count);
      if (baseline > 0 && frIds.length > baseline * factor) {
        alerts.push({
          name: 'scope_creep',
          severity: alert.severity || 'warning',
          action: alert.action || 'review',
          message: `FR count grew from ${baseline} to ${frIds.length}`,
          details: []
        });
      }
    }
  }

  let latestModification = null;
  for (const filePath of [join(featureDir, 'sys.md'), join(featureDir, 'plan.md'), join(featureDir, 'tasks.md')]) {
    if (!existsSync(filePath)) continue;
    const modifiedAt = statSync(filePath).mtime;
    if (!latestModification || modifiedAt > latestModification) latestModification = modifiedAt;
  }

  if (isEnabled('stale_feature') && latestModification) {
    const alert = getAlert('stale_feature');
    const maxAgeDays = Number(alert.max_age_days || 14);
    const ageDays = (Date.now() - latestModification.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > maxAgeDays) {
      alerts.push({
        name: 'stale_feature',
        severity: alert.severity || 'info',
        action: alert.action || 'remind',
        message: `No activity for ${Math.round(ageDays)} days`,
        details: []
      });
    }
  }

  if (isEnabled('stale_assumption') && research && latestModification) {
    const alert = getAlert('stale_assumption');
    const pendingStatus = String(alert.pending_status || 'Pending').toLowerCase();
    const maxAgeDays = Number(alert.max_age_days || 7);
    const assumptionHeadings = research.match(/^#+\s+.*ASM-\d{3}.*/gm) || [];

    for (const heading of assumptionHeadings) {
      const assumptionId = heading.match(/ASM-\d{3}/)?.[0];
      if (!assumptionId) continue;

      const sectionPattern = new RegExp(`### .*${assumptionId}.*\\n([\\s\\S]*?)(?=###|$)`);
      const section = research.match(sectionPattern)?.[1] || '';
      const ageDays = (Date.now() - latestModification.getTime()) / (1000 * 60 * 60 * 24);

      if (section.toLowerCase().includes(pendingStatus) && ageDays > maxAgeDays) {
        alerts.push({
          name: 'stale_assumption',
          severity: alert.severity || 'warning',
          action: alert.action || 'warn',
          message: `${assumptionId} is still pending after ${maxAgeDays} days`,
          details: [assumptionId]
        });
        break;
      }
    }
  }

  if (isEnabled('risk_escalation') && sys) {
    const alert = getAlert('risk_escalation');
    const levels = String(alert.levels || 'High,Critical')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const riskMatches = [...sys.matchAll(/RK-\d{3}/g)];

    for (const match of riskMatches) {
      const riskId = match[0];
      const sectionPattern = new RegExp(`### .*${riskId}.*\\n([\\s\\S]*?)(?=###|$)`);
      const section = sys.match(sectionPattern)?.[1] || '';
      if (levels.some((level) => section.includes(level))) {
        alerts.push({
          name: 'risk_escalation',
          severity: alert.severity || 'critical',
          action: alert.action || 'block',
          message: `${riskId} is flagged as ${levels.join('/')}`,
          details: [riskId]
        });
      }
    }
  }

  const filtered = opts.severity ? alerts.filter((item) => item.severity === opts.severity) : alerts;
  const hasBlocking = filtered.some((item) => item.action === 'block');
  const result = {
    branch,
    alerts: filtered,
    hasBlocking,
    totalAlerts: filtered.length
  };

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (filtered.length === 0) {
    console.log(`✅ No alerts for ${branch}`);
  } else {
    console.log(`⚠️ ${filtered.length} alert(s):`);
    for (const alert of filtered) {
      const icon = { critical: '🔴', high: '🟠', warning: '🟡', info: '🔵' }[alert.severity] || '⚪';
      console.log(`  ${icon} [${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`);
      if (alert.action === 'block') {
        console.log('     ⛔ BLOCKING — must be resolved before proceeding');
      }
    }
  }

  if (hasBlocking) process.exit(1);
}
