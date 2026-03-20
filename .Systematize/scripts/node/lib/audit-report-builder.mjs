import { mergeFindings } from './finding-normalizer.mjs';
import { buildConfidenceCoverageSection, normalizeConfidenceStatement } from './confidence-statement-builder.mjs';

const SECTION_ORDER = [
  ['packageToolchain', 'package.json and toolchain'],
  ['automatedChecks', 'automated checks'],
  ['devVsProduction', 'dev vs production boundaries'],
  ['serverApi', 'server and API'],
  ['sharedLogic', 'shared logic'],
  ['frontend', 'frontend'],
  ['frontendBackendIntegration', 'frontend-backend integration'],
  ['security', 'security'],
  ['performanceAndProductionReadiness', 'performance and production readiness']
];

const SEVERITY_WEIGHT = new Map([
  ['حرج', 4],
  ['عالٍ', 3],
  ['متوسط', 2],
  ['منخفض', 1]
]);

const ACTION_PHASE_TITLES = [
  'المرحلة 1: إيقاف النزيف',
  'المرحلة 2: تثبيت العقود وحدود الطبقات',
  'المرحلة 3: تنظيف المنطق المشترك',
  'المرحلة 4: ضبط الواجهة والتكامل',
  'المرحلة 5: رفع الجاهزية الإنتاجية'
];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeCell(value) {
  return cleanText(value).replace(/\|/g, '\\|') || '—';
}

function sortFindings(records) {
  return [...records].sort((left, right) => {
    const leftWeight = SEVERITY_WEIGHT.get(left.severity) || 0;
    const rightWeight = SEVERITY_WEIGHT.get(right.severity) || 0;
    if (rightWeight !== leftWeight) return rightWeight - leftWeight;
    return left.findingId.localeCompare(right.findingId);
  });
}

function normalizeFindingList(records = []) {
  return sortFindings(mergeFindings(records));
}

function flattenSectionFindings(findingsBySection = {}) {
  return normalizeFindingList(
    SECTION_ORDER.flatMap(([key]) => findingsBySection[key] || [])
  );
}

function inferGeneralState(findings) {
  if (findings.some((record) => record.severity === 'حرج')) {
    return 'Confirmed critical issues exist across core audit layers.';
  }

  if (findings.some((record) => record.severity === 'عالٍ')) {
    return 'The workspace remains unstable for new development until high-severity findings are resolved.';
  }

  return 'No blocking engineering finding was confirmed in the scoped targets.';
}

function inferExecutiveJudgment(findings) {
  if (findings.some((record) => record.severity === 'حرج')) return 'غير مستقر ويحتاج تثبيت فوري';
  if (findings.some((record) => record.severity === 'عالٍ')) return 'يحتاج إصلاحات قبل تطوير جديد';
  return 'صالح للاستمرار كما هو';
}

function formatSummaryIssue(record) {
  return `${record.findingId} — ${record.problem} (${record.layer})`;
}

function buildCriticalIssuesTable(records) {
  const issues = records.length > 0 ? records : [{
    findingId: 'NONE',
    severity: 'منخفض',
    type: 'تحسين مقترح',
    layer: 'toolchain',
    location: 'N/A',
    problem: 'No confirmed critical issue.',
    impact: 'Continue monitoring.',
    fix: 'No immediate fix required.'
  }];

  return [
    '## Critical Issues Table',
    '',
    '| ID | Severity | Type | Layer | Location | Description | Impact | Fix |',
    '|----|----------|------|-------|----------|-------------|--------|-----|',
    ...issues.map((record) =>
      `| ${escapeCell(record.findingId)} | ${escapeCell(record.severity)} | ${escapeCell(record.type)} | ${escapeCell(record.layer)} | ${escapeCell(record.location)} | ${escapeCell(record.problem)} | ${escapeCell(record.impact)} | ${escapeCell(record.fix)} |`
    )
  ].join('\n');
}

function buildLayerSection(title, records) {
  if (records.length === 0) {
    return [`### ${title}`, '', '- No confirmed finding.'].join('\n');
  }

  return [
    `### ${title}`,
    '',
    ...records.map((record) =>
      `- **${record.findingId}** | ${record.severity} | ${record.type} | ${record.location} | ${record.problem} | ${record.impact} | ${record.fix}`
    )
  ].join('\n');
}

function buildLayerFindingsSection(findingsBySection) {
  const sections = SECTION_ORDER.map(([key, title]) =>
    buildLayerSection(title, normalizeFindingList(findingsBySection[key] || []))
  );

  return ['## Layer-by-Layer Findings', '', ...sections].join('\n\n');
}

function normalizePriorityItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) return [fallback];

  return items.map((item) => {
    if (typeof item === 'string') return cleanText(item);
    if (item && typeof item === 'object') return `${item.findingId || 'ITEM'} — ${item.problem || item.title || 'Unspecified item'}`;
    return '';
  }).filter(Boolean);
}

function buildRepairPriorityMap(priorityMap = {}) {
  const immediate = normalizePriorityItems(priorityMap.immediate, 'No immediate blocking fix is currently recorded.');
  const beforeNewFeatures = normalizePriorityItems(priorityMap.beforeNewFeatures, 'No pre-feature fix is currently recorded.');
  const deferrable = normalizePriorityItems(priorityMap.deferrable, 'No deferrable item is currently recorded.');
  const optionalImprovements = normalizePriorityItems(priorityMap.optionalImprovements, 'No optional improvement is currently recorded.');

  return [
    '## Repair Priority Map',
    '',
    '### يجب إصلاحه فورًا',
    '',
    ...immediate.map((item) => `- ${item}`),
    '',
    '### يجب إصلاحه قبل أي ميزة جديدة',
    '',
    ...beforeNewFeatures.map((item) => `- ${item}`),
    '',
    '### يمكن تأجيله',
    '',
    ...deferrable.map((item) => `- ${item}`),
    '',
    '### تحسينات اختيارية',
    '',
    ...optionalImprovements.map((item) => `- ${item}`)
  ].join('\n');
}

function buildDefaultActionPlan(priorityMap = {}) {
  const immediate = normalizePriorityItems(priorityMap.immediate, 'Stabilize the currently blocked path.');
  const beforeNewFeatures = normalizePriorityItems(priorityMap.beforeNewFeatures, 'Close the high-severity findings before new feature work.');
  const deferrable = normalizePriorityItems(priorityMap.deferrable, 'Schedule the medium-severity cleanup after the core fixes.');
  const optionalImprovements = normalizePriorityItems(priorityMap.optionalImprovements, 'Track optional improvements without expanding scope.');

  return [
    {
      title: ACTION_PHASE_TITLES[0],
      goal: 'Stop any confirmed blocker from spreading across additional targets.',
      scope: 'Critical and high-severity findings that currently affect execution.',
      requiredChanges: immediate.join(' | '),
      successCriteria: 'No critical issue remains untriaged.'
    },
    {
      title: ACTION_PHASE_TITLES[1],
      goal: 'Restore stable contracts and clear layer ownership.',
      scope: 'Coverage rules, report contracts, and scope boundaries.',
      requiredChanges: beforeNewFeatures.join(' | '),
      successCriteria: 'Contracts and layer boundaries are stable and reviewable.'
    },
    {
      title: ACTION_PHASE_TITLES[2],
      goal: 'Normalize shared logic and remove duplicated root causes.',
      scope: 'Merged findings, shared utilities, and reusable policy rules.',
      requiredChanges: deferrable.join(' | '),
      successCriteria: 'Repeated root causes are represented once with linked evidence.'
    },
    {
      title: ACTION_PHASE_TITLES[3],
      goal: 'Repair interface and integration assumptions without widening scope.',
      scope: 'Frontend, backend, and cross-layer integration findings.',
      requiredChanges: beforeNewFeatures.join(' | '),
      successCriteria: 'Cross-layer contracts are consistent and testable.'
    },
    {
      title: ACTION_PHASE_TITLES[4],
      goal: 'Raise production readiness and confidence reporting quality.',
      scope: 'Security, performance, production readiness, and observability notes.',
      requiredChanges: optionalImprovements.join(' | '),
      successCriteria: 'The final report can support a go/no-go decision without hidden gaps.'
    }
  ];
}

function normalizeActionPlan(actionPlan, priorityMap) {
  const plan = Array.isArray(actionPlan) && actionPlan.length > 0
    ? actionPlan
    : buildDefaultActionPlan(priorityMap);

  if (plan.length !== ACTION_PHASE_TITLES.length) {
    throw new Error(`Action plan must contain exactly ${ACTION_PHASE_TITLES.length} phases.`);
  }

  return plan.map((phase, index) => ({
    title: cleanText(phase.title) || ACTION_PHASE_TITLES[index],
    goal: cleanText(phase.goal) || 'Goal not provided.',
    scope: cleanText(phase.scope) || 'Scope not provided.',
    requiredChanges: cleanText(phase.requiredChanges) || 'Required changes not provided.',
    successCriteria: cleanText(phase.successCriteria) || 'Success criteria not provided.'
  }));
}

function buildActionPlan(actionPlan, priorityMap) {
  const phases = normalizeActionPlan(actionPlan, priorityMap);

  return [
    '## Action Plan',
    '',
    ...phases.flatMap((phase) => [
      `### ${phase.title}`,
      '',
      `- **الهدف**: ${phase.goal}`,
      `- **النطاق**: ${phase.scope}`,
      `- **التغييرات المطلوبة**: ${phase.requiredChanges}`,
      `- **معيار النجاح**: ${phase.successCriteria}`,
      ''
    ])
  ].join('\n').trimEnd();
}

export function buildAuditReport(input = {}) {
  const findingsBySection = input.findingsBySection || {};
  const allFindings = flattenSectionFindings(findingsBySection);
  const confidenceStatement = normalizeConfidenceStatement(
    input.confidenceStatement || {
      checkResults: input.checkResults,
      targets: input.targets,
      environmentBlockers: input.environmentBlockers,
      manualConstraints: input.manualConstraints
    }
  );

  const topFiveIssues = normalizeFindingList(input.topFiveIssues || allFindings).slice(0, 5);
  const criticalIssues = normalizeFindingList(
    input.criticalIssues || allFindings.filter((record) => ['حرج', 'عالٍ'].includes(record.severity))
  );
  const generalState = cleanText(input.generalState) || inferGeneralState(allFindings);
  const executiveJudgment = cleanText(input.executiveJudgment) || inferExecutiveJudgment(allFindings);
  const reviewer = cleanText(input.reviewer) || 'AI Review';

  return [
    `# Executive Audit Report: ${cleanText(input.featureName) || 'Unnamed Feature'}`,
    '',
    `**Branch**: \`${cleanText(input.branch) || 'unknown-branch'}\``,
    `**Date**: ${cleanText(input.date) || new Date().toISOString().slice(0, 10)}`,
    `**Reviewer**: ${reviewer}`,
    `**Review Mode**: ${confidenceStatement.reviewMode}`,
    `**Confidence Level**: ${confidenceStatement.confidenceLevel}`,
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    `- **General State**: ${generalState}`,
    '- **Top Five Issues**:',
    ...(topFiveIssues.length > 0
      ? topFiveIssues.map((record, index) => `  ${index + 1}. ${formatSummaryIssue(record)}`)
      : ['  1. No confirmed issue entered the top-five list.']),
    `- **Executive Judgment**: ${executiveJudgment}`,
    '',
    '---',
    '',
    buildCriticalIssuesTable(criticalIssues),
    '',
    '---',
    '',
    buildLayerFindingsSection(findingsBySection),
    '',
    '---',
    '',
    buildConfidenceCoverageSection(confidenceStatement),
    '',
    '---',
    '',
    buildRepairPriorityMap(input.repairPriorityMap),
    '',
    '---',
    '',
    buildActionPlan(input.actionPlan, input.repairPriorityMap)
  ].join('\n');
}
