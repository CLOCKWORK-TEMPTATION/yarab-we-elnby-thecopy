import { REQUIRED_CHECK_NAMES } from './check-catalog.mjs';

export const REVIEW_MODES = Object.freeze([
  'Static Analysis Only',
  'Partial Execution Review',
  'Full Execution Review'
]);

export const CONFIDENCE_LEVELS = Object.freeze(['Low', 'Medium', 'High']);

const ALLOWED_TARGET_STATUSES = new Set(['inspected', 'blocked', 'out_of_scope', 'not_present']);
const ALLOWED_CHECK_STATUSES = new Set(['executed', 'failed', 'blocked']);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueList(values = []) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function normalizeCheckRecord(record = {}) {
  const checkName = cleanText(record.checkName);
  const status = cleanText(record.status);

  if (!checkName) throw new Error('checkName is required');
  if (!ALLOWED_CHECK_STATUSES.has(status)) throw new Error(`Unsupported check status: ${status}`);

  return {
    checkName,
    scope: cleanText(record.scope) || 'repo-root',
    status,
    directCause: cleanText(record.directCause),
    confidenceImpact: cleanText(record.confidenceImpact).toLowerCase() || 'low',
    outputRef: cleanText(record.outputRef)
  };
}

function normalizeTargetRecord(target = {}) {
  const coverageStatus = cleanText(target.coverageStatus) || 'not_present';
  if (!ALLOWED_TARGET_STATUSES.has(coverageStatus)) {
    throw new Error(`Unsupported coverageStatus: ${coverageStatus}`);
  }

  return {
    path: cleanText(target.path),
    relativePath: cleanText(target.relativePath),
    targetType: cleanText(target.targetType),
    coverageStatus,
    blockedReason: cleanText(target.blockedReason),
    evidenceRef: cleanText(target.evidenceRef)
  };
}

function summarizeCoverage(targets) {
  const summary = {
    totalTargets: targets.length,
    inspectedTargets: 0,
    blockedTargets: 0,
    notPresentTargets: 0,
    outOfScopeTargets: 0,
    partialTargets: 0,
    uncoveredAreas: []
  };

  for (const target of targets) {
    const targetLabel = target.relativePath || target.path || 'unknown-target';
    const detail = [target.blockedReason, target.evidenceRef].filter(Boolean).join(' | ');
    const partial = /partial|subset|narrow|جزئي|limited/i.test(detail);

    switch (target.coverageStatus) {
      case 'inspected':
        summary.inspectedTargets += 1;
        if (partial) {
          summary.partialTargets += 1;
          summary.uncoveredAreas.push(`${targetLabel}: partial coverage`);
        }
        break;
      case 'blocked':
        summary.blockedTargets += 1;
        summary.uncoveredAreas.push(`${targetLabel}: ${target.blockedReason || 'blocked'}`);
        break;
      case 'not_present':
        summary.notPresentTargets += 1;
        summary.uncoveredAreas.push(`${targetLabel}: ${target.blockedReason || 'not present'}`);
        break;
      case 'out_of_scope':
        summary.outOfScopeTargets += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

function classifyReviewMode({ executedChecks, blockedChecks, failedChecks, coverage, environmentBlockers }) {
  if (executedChecks.length === 0) return REVIEW_MODES[0];

  const completeChecks = executedChecks.length === REQUIRED_CHECK_NAMES.length;
  const noCoverageGap = coverage.blockedTargets === 0 && coverage.notPresentTargets === 0 && coverage.partialTargets === 0;
  const noExecutionGap = blockedChecks.length === 0 && failedChecks.length === 0 && environmentBlockers.length === 0;

  if (completeChecks && noCoverageGap && noExecutionGap) return REVIEW_MODES[2];
  return REVIEW_MODES[1];
}

function classifyConfidenceLevel({ reviewMode, blockedChecks, failedChecks, coverage, environmentBlockers, manualConstraints }) {
  if (reviewMode === REVIEW_MODES[2] &&
      blockedChecks.length === 0 &&
      failedChecks.length === 0 &&
      coverage.blockedTargets === 0 &&
      coverage.notPresentTargets === 0 &&
      coverage.partialTargets === 0 &&
      environmentBlockers.length === 0 &&
      manualConstraints.length === 0) {
    return CONFIDENCE_LEVELS[2];
  }

  const severeCoverageGap = coverage.blockedTargets > 0 || coverage.notPresentTargets > 0 || failedChecks.length > 0;
  if (reviewMode === REVIEW_MODES[0] || environmentBlockers.length > 0 || severeCoverageGap) {
    return CONFIDENCE_LEVELS[0];
  }

  return CONFIDENCE_LEVELS[1];
}

export function buildConfidenceStatement(input = {}) {
  const checkResults = (input.checkResults || []).map((record) => normalizeCheckRecord(record));
  const targets = (input.targets || []).map((target) => normalizeTargetRecord(target));
  const environmentBlockers = uniqueList(input.environmentBlockers || []);
  const manualConstraints = uniqueList(input.manualConstraints || []);

  const executedChecks = uniqueList(checkResults
    .filter((record) => record.status === 'executed')
    .map((record) => record.checkName));

  const blockedChecks = uniqueList(checkResults
    .filter((record) => record.status === 'blocked')
    .map((record) => `${record.checkName}: ${record.directCause || 'blocked'}`));

  const failedChecks = uniqueList(checkResults
    .filter((record) => record.status === 'failed')
    .map((record) => `${record.checkName}: ${record.directCause || 'failed'}`));

  const coverage = summarizeCoverage(targets);
  const reviewMode = classifyReviewMode({
    executedChecks,
    blockedChecks,
    failedChecks,
    coverage,
    environmentBlockers
  });

  const confidenceLevel = classifyConfidenceLevel({
    reviewMode,
    blockedChecks,
    failedChecks,
    coverage,
    environmentBlockers,
    manualConstraints
  });

  const uncoveredAreas = uniqueList([
    ...coverage.uncoveredAreas,
    ...environmentBlockers,
    ...manualConstraints
  ]);

  const rationaleParts = [];
  if (reviewMode === REVIEW_MODES[2]) {
    rationaleParts.push('All required checks executed across the scoped targets.');
  } else if (reviewMode === REVIEW_MODES[1]) {
    rationaleParts.push('Execution evidence is partial and must be interpreted with explicit coverage limits.');
  } else {
    rationaleParts.push('The verdict is primarily based on static inspection because execution evidence is unavailable.');
  }

  if (blockedChecks.length > 0) rationaleParts.push(`Blocked checks: ${blockedChecks.join(', ')}.`);
  if (failedChecks.length > 0) rationaleParts.push(`Failed checks: ${failedChecks.join(', ')}.`);
  if (environmentBlockers.length > 0) rationaleParts.push(`Environment blockers: ${environmentBlockers.join(', ')}.`);
  if (coverage.partialTargets > 0 || coverage.notPresentTargets > 0 || coverage.blockedTargets > 0) {
    rationaleParts.push(
      `Coverage gaps: blocked=${coverage.blockedTargets}, not_present=${coverage.notPresentTargets}, partial=${coverage.partialTargets}.`
    );
  }

  return {
    reviewMode,
    confidenceLevel,
    expectedChecks: [...REQUIRED_CHECK_NAMES],
    executedChecks,
    blockedChecks: [...blockedChecks, ...failedChecks],
    blockedAreas: uniqueList([
      ...environmentBlockers,
      ...blockedChecks,
      ...failedChecks
    ]),
    uncoveredAreas,
    confidenceRationale: rationaleParts.join(' '),
    residualRisk: uncoveredAreas.length > 0
      ? uncoveredAreas.join('; ')
      : 'No material residual coverage gap.',
    coverage
  };
}
