import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function readFileOrEmpty(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function addCheck(checks, name, score, issues = []) {
  const safeScore = Math.min(10, Math.max(0, score));
  checks.push({ name, score: safeScore, maxScore: 10, issues });
  return safeScore;
}

export function evaluateFeatureHealth(featureDir, threshold = 70) {
  const sysContent = readFileOrEmpty(join(featureDir, 'sys.md'));
  const planContent = readFileOrEmpty(join(featureDir, 'plan.md'));
  const tasksContent = readFileOrEmpty(join(featureDir, 'tasks.md'));
  const allContent = `${sysContent}\n${planContent}\n${tasksContent}`;

  const checks = [];
  let totalScore = 0;

  const frIds = [...new Set(sysContent.match(/FR-\d{3}/g) || [])];
  const linkedFrIds = [...new Set(allContent.match(/(?<=\|\s*)FR-\d{3}/g) || [])];
  const frWithoutAc = frIds.filter((item) => !linkedFrIds.includes(item));
  totalScore += addCheck(
    checks,
    'FR→AC linkage',
    frIds.length === 0 ? 10 : 10 - frWithoutAc.length * 2,
    frWithoutAc.map((item) => `${item} missing AC link`)
  );

  const placeholders = [...new Set(allContent.match(/\[NEEDS CLARIFICATION[^\]]*\]|\[TBD[^\]]*\]/g) || [])];
  totalScore += addCheck(
    checks,
    'No placeholders',
    10 - placeholders.length * 3,
    placeholders.map((item) => `Placeholder: ${item}`)
  );

  const frInPlan = [...new Set(planContent.match(/FR-\d{3}/g) || [])];
  const frInTasks = [...new Set(tasksContent.match(/FR-\d{3}/g) || [])];
  const traceIssues = [];
  if (planContent) frIds.filter((item) => !frInPlan.includes(item)).forEach((item) => traceIssues.push(`${item} not in plan.md`));
  if (tasksContent) frIds.filter((item) => !frInTasks.includes(item)).forEach((item) => traceIssues.push(`${item} not in tasks.md`));
  totalScore += addCheck(
    checks,
    'Traceability',
    frIds.length === 0 ? 10 : 10 - traceIssues.length,
    traceIssues
  );

  const duplicateIssues = [];
  for (const content of [sysContent, planContent, tasksContent]) {
    const ids = content.match(/(?:FR|NFR|BR|AC|RK|ASM|TC|INT|ADR|OBJ|KPI)-\d{3}/g) || [];
    const counts = ids.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    for (const [item, count] of Object.entries(counts)) {
      if (count > 3) duplicateIssues.push(`${item} appears ${count} times`);
    }
  }
  totalScore += addCheck(checks, 'No duplicate IDs', 10 - duplicateIssues.length * 5, duplicateIssues);

  const sequenceIssues = [];
  for (const prefix of ['FR-', 'NFR-', 'AC-', 'RK-']) {
    const numbers = [...new Set((allContent.match(new RegExp(`${prefix.replace('-', '\\-')}\\d{3}`, 'g')) || []))]
      .map((item) => Number.parseInt(item.replace(prefix, ''), 10))
      .sort((a, b) => a - b);

    for (let index = 1; index < numbers.length; index += 1) {
      if (numbers[index] !== numbers[index - 1] + 1) {
        sequenceIssues.push(`${prefix} gap between ${numbers[index - 1]} and ${numbers[index]}`);
      }
    }
  }
  totalScore += addCheck(checks, 'Sequential IDs', 10 - sequenceIssues.length * 2, sequenceIssues);

  const nfrIds = [...new Set(sysContent.match(/NFR-\d{3}/g) || [])];
  const nfrIssues = [];
  for (const item of nfrIds) {
    const line = sysContent.split('\n').find((entry) => entry.includes(item)) || '';
    if (!/\d+[%ms]|\d+\.\d+|[≤≥<>]|\d+\s*(?:seconds?|ms|hours?|users?|req)/.test(line)) {
      nfrIssues.push(`${item} may lack measurable target`);
    }
  }
  totalScore += addCheck(
    checks,
    'NFR measurability',
    nfrIds.length === 0 ? 10 : 10 - nfrIssues.length * 2,
    nfrIssues
  );

  const riskIds = [...new Set(allContent.match(/RK-\d{3}/g) || [])];
  const riskIssues = [];
  for (const item of riskIds) {
    const lines = allContent.split('\n').filter((entry) => entry.includes(item));
    if (!lines.some((entry) => /خطة|mitigation|تخفيف|plan|strategy/.test(entry) || entry.split('|').length >= 5)) {
      riskIssues.push(`${item} may lack mitigation`);
    }
  }
  totalScore += addCheck(
    checks,
    'Risk mitigation',
    riskIds.length === 0 ? 10 : 10 - riskIssues.length * 3,
    riskIssues
  );

  const taskIssues = [];
  const taskSections = tasksContent.split(/(?=###\s+(?:BE|FE|DO|CC)-T-\d{3})/);
  for (const section of taskSections) {
    const match = section.match(/((?:BE|FE|DO|CC)-T-\d{3})/);
    if (match && !section.includes('Acceptance Criteria')) {
      taskIssues.push(`${match[1]} missing acceptance criteria`);
    }
  }
  totalScore += addCheck(
    checks,
    'Task AC coverage',
    taskSections.length <= 1 ? 10 : 10 - taskIssues.length * 2,
    taskIssues
  );

  const bannedWords = ['\\bfast\\b', '\\beasy\\b', '\\bsecure\\b', '\\bflexible\\b', '\\brobust\\b', '\\bintuitive\\b', '\\bscalable\\b'];
  const bannedIssues = [];
  for (const item of bannedWords) {
    const match = sysContent.match(new RegExp(item, 'i'));
    if (match) bannedIssues.push(`"${match[0]}" found in sys.md`);
  }
  totalScore += addCheck(checks, 'No banned words', 10 - bannedIssues.length * 3, bannedIssues);

  const changelogIssues = [];
  for (const [fileName, content] of [['sys.md', sysContent], ['plan.md', planContent], ['tasks.md', tasksContent]]) {
    if (content && !content.includes('## Changelog')) {
      changelogIssues.push(`${fileName} missing Changelog`);
    }
  }
  totalScore += addCheck(checks, 'Changelog present', 10 - changelogIssues.length * 3, changelogIssues);

  return {
    score: totalScore,
    maxScore: 100,
    threshold,
    status: totalScore >= threshold ? 'ADVISORY_PASS' : 'ADVISORY_FAIL',
    scope: 'heuristic',
    checks
  };
}

export function getFeatureLastActivity(featureDir) {
  let latest = null;

  if (!existsSync(featureDir)) return null;

  for (const entry of readdirSync(featureDir, { withFileTypes: true })) {
    const entryPath = join(featureDir, entry.name);

    if (entry.isDirectory()) {
      const nested = getFeatureLastActivity(entryPath);
      if (nested && (!latest || nested > latest)) latest = nested;
      continue;
    }

    const modifiedAt = statSync(entryPath).mtime;
    if (!latest || modifiedAt > latest) latest = modifiedAt;
  }

  return latest;
}

export function getTaskCompletionStats(tasksContent) {
  const totalTasks = (tasksContent.match(/(?:BE|FE|DO|CC)-T-\d{3}/g) || []).length;
  const completedTasks = (tasksContent.match(/\[X\]|\[x\]/g) || []).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return { totalTasks, completedTasks, completionPercent };
}
