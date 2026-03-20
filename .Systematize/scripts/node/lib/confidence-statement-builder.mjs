import { buildConfidenceStatement } from './confidence-policy.mjs';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatInlineList(values, fallback = 'None') {
  const normalized = [...new Set((values || []).map((value) => cleanText(value)).filter(Boolean))];
  return normalized.length > 0 ? normalized.join(', ') : fallback;
}

export function normalizeConfidenceStatement(input = {}) {
  if (input.reviewMode && input.confidenceLevel) {
    return {
      reviewMode: cleanText(input.reviewMode),
      confidenceLevel: cleanText(input.confidenceLevel),
      executedChecks: [...new Set(input.executedChecks || [])],
      blockedChecks: [...new Set(input.blockedChecks || [])],
      blockedAreas: [...new Set(input.blockedAreas || [])],
      uncoveredAreas: [...new Set(input.uncoveredAreas || [])],
      confidenceRationale: cleanText(input.confidenceRationale) || 'No rationale provided.',
      residualRisk: cleanText(input.residualRisk) || 'No residual risk recorded.'
    };
  }

  return buildConfidenceStatement(input);
}

export function buildConfidenceCoverageSection(input = {}) {
  const statement = normalizeConfidenceStatement(input);

  return [
    '## Confidence and Coverage',
    '',
    `- **Review Mode**: ${statement.reviewMode}`,
    `- **Confidence Level**: ${statement.confidenceLevel}`,
    `- **Executed Checks**: ${formatInlineList(statement.executedChecks)}`,
    `- **Blocked Checks**: ${formatInlineList(statement.blockedChecks)}`,
    `- **Uncovered Areas**: ${formatInlineList(statement.uncoveredAreas)}`,
    `- **Confidence Rationale**: ${statement.confidenceRationale}`,
    `- **Residual Risk**: ${statement.residualRisk}`
  ].join('\n');
}
