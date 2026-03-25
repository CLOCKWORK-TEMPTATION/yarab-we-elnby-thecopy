import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureDir } from '../common.mjs';

const TYPE_LABELS = {
  confirmed_error: 'خطأ مؤكد',
  potential_risk: 'خطر محتمل',
  design_weakness: 'ضعف تصميمي',
  documentation_drift: 'انجراف توثيقي',
  execution_gap: 'فجوة تنفيذ/تحقق',
  out_of_scope: 'خارج النطاق'
};

const SEVERITY_LABELS = {
  critical: 'حرج',
  high: 'عالٍ',
  medium: 'متوسط',
  low: 'منخفض'
};

const SECTION_TITLES = [
  ['toolchain_workspace', 'Toolchain and Workspace'],
  ['automated_checks', 'Automated Checks'],
  ['documentation_drift', 'Documentation Drift'],
  ['frontend', 'Frontend'],
  ['editor_subtree', 'Editor Subtree'],
  ['backend', 'Backend'],
  ['shared_packages', 'Shared Packages'],
  ['frontend_backend_integration', 'Frontend–Backend Integration'],
  ['security_production_readiness', 'Security and Production Readiness']
];

function escapeMarkdownTableCell(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' <br> ')
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`');
}

function formatFindingRow(finding) {
  return `| ${escapeMarkdownTableCell(finding.id)} | ${SEVERITY_LABELS[finding.severity] || finding.severity} | ${TYPE_LABELS[finding.type] || finding.type} | ${escapeMarkdownTableCell(finding.layer)} | ${escapeMarkdownTableCell(finding.location)} | ${escapeMarkdownTableCell(finding.problem)} | ${escapeMarkdownTableCell(finding.evidence)} | ${escapeMarkdownTableCell(finding.impact)} | ${escapeMarkdownTableCell(finding.fix)} |`;
}

function renderFindingsTable(findings = []) {
  if (findings.length === 0) {
    return 'لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.\n';
  }

  return [
    '| ID | Severity | Type | Layer | Location | Problem | Evidence | Impact | Minimal Fix |',
    '|----|----------|------|-------|----------|---------|----------|--------|-------------|',
    ...findings.map(formatFindingRow)
  ].join('\n');
}

function renderCheckTable(checks = []) {
  if (checks.length === 0) {
    return 'لا توجد أوامر فحص منفذة أو مخططة في هذه الدورة.\n';
  }

  return [
    '| الفحص | السكربت | الحالة | الأمر |',
    '|------|---------|--------|-------|',
    ...checks.map((check) => `| ${check.name} | ${check.script || 'غير متاح'} | ${check.status} | ${(check.command || 'N/A').replace(/\|/g, '\\|')} |`)
  ].join('\n');
}

function renderCriticalIssues(findings = []) {
  if (findings.length === 0) {
    return 'لا توجد مشكلات حرجة أو عالية ضمن حدود الأدلة الحالية.\n';
  }

  return [
    '| ID | Severity | Type | Layer | Location | Problem | Evidence | Impact | Minimal Fix |',
    '|----|----------|------|-------|----------|---------|----------|--------|-------------|',
    ...findings.map(formatFindingRow)
  ].join('\n');
}

function renderCoverageLines(coverage) {
  const executedChecks = coverage.executed_checks.length > 0
    ? coverage.executed_checks.map((item) => item.command).join(' | ')
    : 'لا توجد أوامر منفذة بنجاح أو بفشل قابل للقياس.';
  const lines = [
    `- ما الذي تم التحقق منه فعليًا: ${coverage.reviewed_artifacts.join('، ')}`,
    `- ما الذي تعذر تنفيذه: ${coverage.blocked_checks.length > 0 ? coverage.blocked_checks.map((item) => item.command || item.name).join(' | ') : 'لا يوجد.'}`,
    `- ما الذي تم تعويضه بتحليل ساكن: ${coverage.unavailable_checks.length > 0 ? coverage.unavailable_checks.map((item) => item.name).join('، ') : 'لا يوجد.'}`,
    `- ما الذي بقي خارج التغطية: ${coverage.skipped_layers.length > 0 ? coverage.skipped_layers.map((item) => `${item.layer}: ${item.reason}`).join(' | ') : 'لا يوجد.'}`
  ];

  lines.push(`- الأوامر التنفيذية التي أمكن تشغيلها: ${executedChecks}`);

  if (coverage.confidence_reasons.length > 0) {
    lines.push(`- لماذا الثقة High أو Medium أو Low: ${coverage.confidence_reasons.map((item) => `${item.message} (${item.evidence})`).join(' | ')}`);
  } else {
    lines.push('- لماذا الثقة High أو Medium أو Low: لا توجد فجوات تغطية تقلل الثقة ضمن الأدلة الحالية.');
  }

  return lines.join('\n');
}

function renderPriorityMap(priorityMap) {
  const groups = [
    'يجب إصلاحه فورًا',
    'يجب إصلاحه قبل أي ميزة جديدة',
    'يمكن تأجيله بشروط',
    'خارج النطاق الحالي'
  ];

  const parts = [];
  for (const group of groups) {
    parts.push(`### ${group}`);
    const findings = priorityMap[group] || [];
    if (findings.length === 0) {
      parts.push('لا توجد عناصر في هذه الفئة.\n');
      continue;
    }

    for (const finding of findings) {
      parts.push(`- ${finding.id}: ${finding.problem} — ${finding.fix}`);
    }
    parts.push('');
  }

  return parts.join('\n').trimEnd();
}

function renderActionPlan(actionPlan) {
  const orderedPhases = [
    actionPlan.phase_1,
    actionPlan.phase_2,
    actionPlan.phase_3,
    actionPlan.phase_4,
    actionPlan.phase_5
  ];

  return orderedPhases.map((phase) => [
    `### ${phase.title}`,
    `- الهدف: ${phase.goal}`,
    `- النطاق: ${phase.scope.length > 0 ? phase.scope.join(' | ') : 'لا توجد عناصر مرشحة حاليًا.'}`,
    `- التغييرات المطلوبة: ${phase.scope.length > 0 ? phase.scope.join(' | ') : 'لا توجد تغييرات إضافية مطلوبة في هذه المرحلة ضمن الأدلة الحالية.'}`,
    `- معيار النجاح: ${phase.success}`
  ].join('\n')).join('\n\n');
}

export function renderReviewFile(report) {
  const lines = [
    '# Review',
    '',
    '## Executive Summary',
    `- Scope: ${report.reviewed_artifacts.join(', ')} + root manifests + apps/web + apps/backend + packages + apps/web/src/app/(main)/editor`,
    `- Review Mode: ${report.review_mode}`,
    `- Confidence: ${report.confidence}`,
    `- Executive Judgment: ${report.executive_judgment}`,
    `- **Verdict**: ${report.gate_verdict}`,
    '',
    'أخطر المشكلات المؤكدة ضمن حدود الأدلة الحالية:',
    ...(report.critical_issues.slice(0, 5).map((finding, index) => `${index + 1}. ${finding.problem}`)),
    ...(report.critical_issues.length === 0 ? ['1. لا توجد مشكلات حرجة أو عالية ضمن الأدلة الحالية.'] : []),
    '',
    '## Critical Issues Table',
    renderCriticalIssues(report.critical_issues),
    '',
    '## Layer-by-Layer Findings',
    ''
  ];

  for (const [sectionKey, sectionTitle] of SECTION_TITLES) {
    lines.push(`### ${sectionTitle}`);

    if (sectionKey === 'automated_checks') {
      lines.push(renderCheckTable(report.automated_checks));
      lines.push('');
    }

    lines.push(renderFindingsTable(report.sections[sectionKey] || []));
    lines.push('');
  }

  lines.push('## Confidence and Coverage');
  lines.push(renderCoverageLines(report.coverage));
  lines.push('');
  lines.push('## Repair Priority Map');
  lines.push(renderPriorityMap(report.repair_priority_map));
  lines.push('');
  lines.push('## Action Plan');
  lines.push(renderActionPlan(report.action_plan));
  lines.push('');

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function writeReviewFile(outputPath, report) {
  ensureDir(dirname(outputPath));
  const content = renderReviewFile(report);
  writeFileSync(outputPath, content, 'utf8');
  return content;
}
