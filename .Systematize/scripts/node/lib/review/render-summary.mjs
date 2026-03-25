const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

function sortFindings(findings = []) {
  return [...findings].sort((left, right) => {
    const severityDelta = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severityDelta !== 0) return severityDelta;
    return String(left.problem || '').localeCompare(String(right.problem || ''));
  });
}

export function renderReviewSummary({ reviewMode, confidence, detectedLayers = [], findings = [], incompleteChecks = [] }) {
  const topFindings = sortFindings(findings).slice(0, 5);
  const lines = [
    '## Executive Summary',
    `- Review Mode: ${reviewMode}`,
    `- Confidence: ${confidence}`,
    `- Layers: ${detectedLayers.length > 0 ? detectedLayers.join(', ') : 'none detected'}`
  ];

  if (incompleteChecks.length > 0) {
    lines.push(`- Coverage Gaps: ${incompleteChecks.join(', ')}`);
  }

  lines.push('- Top Issues:');
  for (const finding of topFindings) {
    lines.push(`  ${topFindings.indexOf(finding) + 1}. [${finding.severity}] ${finding.problem}`);
  }

  return lines.slice(0, 15).join('\n');
}
