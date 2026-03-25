import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureDir } from '../common.mjs';

const TYPE_LABELS = {
  confirmed_error: 'خطأ مؤكد',
  potential_risk: 'خطر محتمل',
  design_weakness: 'ضعف تصميمي',
  suggested_improvement: 'تحسين مقترح'
};

const SEVERITY_LABELS = {
  critical: 'حرج',
  high: 'عالٍ',
  medium: 'متوسط',
  low: 'منخفض'
};

const SECTION_TITLES = [
  ['toolchain', 'package.json and toolchain'],
  ['automated_checks', 'automated checks'],
  ['dev_vs_production', 'dev vs production boundaries'],
  ['server', 'server and API'],
  ['shared', 'shared logic'],
  ['frontend', 'frontend'],
  ['integration', 'frontend-backend integration'],
  ['security', 'security'],
  ['performance_production', 'performance and production readiness']
];

function formatFindingRow(finding) {
  return `| ${finding.id} | ${SEVERITY_LABELS[finding.severity] || finding.severity} | ${TYPE_LABELS[finding.type] || finding.type} | ${finding.layer} | ${finding.location.replace(/\|/g, '\\|')} | ${finding.problem.replace(/\|/g, '\\|')} | ${finding.impact.replace(/\|/g, '\\|')} | ${finding.fix.replace(/\|/g, '\\|')} |`;
}

function renderFindingsTable(findings = []) {
  if (findings.length === 0) {
    return 'لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.\n';
  }

  return [
    '| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |',
    '|----|-------|-------|--------|--------|-------|-------|---------|',
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
    '| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |',
    '|----|-------|-------|--------|--------|-------|-------|---------|',
    ...findings.map(formatFindingRow)
  ].join('\n');
}

function renderCoverageLines(coverage) {
  const lines = [
    `- ما تم فحصه: ${coverage.reviewed_artifacts.join('، ')}`,
    `- ما تم تشغيله: ${coverage.executed_checks.length > 0 ? coverage.executed_checks.map((item) => item.command).join(' | ') : 'لم ينجح أي فحص تنفيذي كامل.'}`,
    `- ما تعذر تشغيله: ${coverage.blocked_checks.length > 0 ? coverage.blocked_checks.map((item) => item.command || item.name).join(' | ') : 'لا يوجد.'}`,
    `- ما لم يتوفر: ${coverage.unavailable_checks.length > 0 ? coverage.unavailable_checks.map((item) => item.name).join('، ') : 'لا يوجد.'}`
  ];

  if (coverage.skipped_layers.length > 0) {
    lines.push(`- الطبقات غير المقيمة بالكامل: ${coverage.skipped_layers.map((item) => `${item.layer}: ${item.reason}`).join(' | ')}`);
  } else {
    lines.push('- الطبقات غير المقيمة بالكامل: لا يوجد.');
  }

  if (coverage.confidence_reasons.length > 0) {
    lines.push(`- أثر ذلك على الثقة: ${coverage.confidence_reasons.map((item) => `${item.message} (${item.evidence})`).join(' | ')}`);
  } else {
    lines.push('- أثر ذلك على الثقة: لا توجد فجوات تغطية تقلل الثقة ضمن الأدلة الحالية.');
  }

  return lines.join('\n');
}

function renderPriorityMap(priorityMap) {
  const groups = [
    'يجب إصلاحه فورًا',
    'يجب إصلاحه قبل أي ميزة جديدة',
    'يمكن تأجيله',
    'تحسينات اختيارية'
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
    '# Strict Engineering Review Report',
    '',
    `**Branch**: \`${report.request_context.branch}\``,
    `**Date**: ${report.generated_at.slice(0, 10)}`,
    '**Reviewer**: Codex',
    `**Artifacts Reviewed**: ${report.reviewed_artifacts.join(', ')}`,
    '',
    '## Executive Summary',
    `**Verdict**: ${report.gate_verdict}`,
    `**Review Mode**: ${report.review_mode}`,
    `**Confidence**: ${report.confidence}`,
    `**Executive Judgment**: ${report.executive_judgment}`,
    '',
    'هذه المراجعة تعتمد على أدلة بنيوية وتشغيلية من المستودع الحالي وتعرض الحقيقة الهندسية كما هي ضمن حدود ما أمكن تشغيله فعليًا.',
    'القرار التنفيذي يجب أن يُقرأ مع التغطية الفعلية ومع الموانع أو الطبقات غير المقيمة بالكامل.',
    '',
    'أخطر خمس مشكلات:',
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
