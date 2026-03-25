import { join } from 'node:path';
import { createGateStatus } from './gate-status.mjs';
import { createReviewRequestContext } from './request-context.mjs';
import { deriveConfidenceModel } from './confidence-model.mjs';
import { auditDocumentationDrift } from './documentation-drift-audit.mjs';
import { auditDevProductionBoundaries } from './dev-prod-audit.mjs';
import { auditEditorSubtree } from './editor-subtree-audit.mjs';
import { auditFrontendAndIntegration } from './frontend-integration-audit.mjs';
import { normalizeFindings } from './normalize-findings.mjs';
import { runP1BaselineReview, inferAutomatedCheckFindings } from './p1-orchestrator.mjs';
import { buildRepairPriorityMap, buildFivePhaseActionPlan } from './repair-plan.mjs';
import { auditSecurityAndReadiness } from './security-readiness-audit.mjs';
import { auditServerAndSharedLogic } from './server-shared-audit.mjs';

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

function addReviewSection(findings = [], reviewSection) {
  return findings.map((finding) => ({ ...finding, review_section: reviewSection }));
}

function sortFindings(findings = []) {
  return [...findings].sort((left, right) => {
    const severityDelta = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severityDelta !== 0) return severityDelta;
    return String(left.problem || '').localeCompare(String(right.problem || ''));
  });
}

function determineExecutiveJudgment(findings = [], confidenceModel) {
  if (findings.some((finding) => finding.severity === 'critical')) {
    return 'غير مستقر ويحتاج تثبيت فوري';
  }

  if (findings.some((finding) => finding.severity === 'high')) {
    return 'يحتاج إصلاحات قبل تطوير جديد';
  }

  if (confidenceModel.confidence !== 'High') {
    return 'يحتاج إصلاحات قبل تطوير جديد';
  }

  return 'صالح للاستمرار كما هو';
}

function determineGateVerdict(findings = [], confidenceModel) {
  if (findings.some((finding) => ['critical', 'high'].includes(finding.severity))) {
    return '🔴 CHANGES REQUIRED';
  }

  if (confidenceModel.confidence !== 'High' || findings.some((finding) => finding.severity === 'medium')) {
    return '🟡 APPROVED WITH CONDITIONS';
  }

  return '🟢 APPROVED';
}

function buildReviewGate(verdict, findings = []) {
  if (verdict.includes('CHANGES REQUIRED')) {
    const blocker = sortFindings(findings).find((finding) => ['critical', 'high'].includes(finding.severity));
    return createGateStatus({
      gate: 'strict-engineering-review',
      status: 'blocked',
      blocker: {
        reason: blocker?.problem || 'Critical or high findings remain open.',
        severity: blocker?.severity || 'high'
      },
      notes: 'Implementation must not proceed until blocking review findings are resolved.'
    });
  }

  if (verdict.includes('WITH CONDITIONS')) {
    return createGateStatus({
      gate: 'strict-engineering-review',
      status: 'degraded',
      notes: 'Implementation may proceed only with explicit awareness of the open medium-risk findings or coverage gaps.'
    });
  }

  return createGateStatus({
    gate: 'strict-engineering-review',
    status: 'ready',
    notes: 'No blocking findings remain within the current evidence boundary.'
  });
}

function filterSectionFindings(findings = [], sectionName, layerNames = []) {
  return sortFindings(findings.filter((finding) => {
    const reviewSections = finding.review_sections || [];
    if (reviewSections.includes(sectionName)) return true;
    if (layerNames.includes(finding.layer)) return true;
    return false;
  }));
}

function collectSkippedLayers(...sources) {
  return sources.flatMap((source) => source?.skipped_layers || []);
}

function buildCoverageSummary({ baseline, confidenceModel, skippedLayers }) {
  return {
    reviewed_artifacts: [
      'package.json',
      'sys.md',
      'plan.md',
      'tasks.md'
    ],
    executed_checks: baseline.automated_checks.results.filter((item) => ['success', 'failure'].includes(item.status)),
    blocked_checks: baseline.automated_checks.results.filter((item) => item.status === 'blocked'),
    unavailable_checks: baseline.automated_checks.results.filter((item) => item.status === 'unavailable'),
    skipped_layers: skippedLayers,
    confidence_reasons: confidenceModel.reasons
  };
}

export function runReviewPipeline(repoRoot, options = {}) {
  const featureDir = options.featureDir || join(repoRoot, 'features');
  const reviewFile = options.reviewFile || join(featureDir, 'review.md');
  const baseline = runP1BaselineReview(repoRoot, { execute: options.execute !== false });
  const documentationDrift = auditDocumentationDrift(repoRoot);
  const devProd = auditDevProductionBoundaries(repoRoot);
  const editorSubtree = auditEditorSubtree(repoRoot);
  const serverShared = auditServerAndSharedLogic(repoRoot);
  const frontendIntegration = auditFrontendAndIntegration(repoRoot);
  const securityReadiness = auditSecurityAndReadiness(repoRoot);
  const skippedLayers = collectSkippedLayers(editorSubtree, serverShared, frontendIntegration);

  const confidenceModel = deriveConfidenceModel({
    checkResults: baseline.automated_checks.results,
    skippedLayers
  });

  const allFindings = normalizeFindings([
    ...addReviewSection(baseline.toolchain.findings, 'toolchain'),
    ...addReviewSection(inferAutomatedCheckFindings(baseline.automated_checks.results), 'automated_checks'),
    ...addReviewSection(documentationDrift.findings, 'documentation_drift'),
    ...addReviewSection(frontendIntegration.findings.filter((finding) => finding.layer === 'frontend'), 'frontend'),
    ...addReviewSection(editorSubtree.findings, 'editor_subtree'),
    ...addReviewSection(serverShared.findings.filter((finding) => finding.layer === 'server'), 'backend'),
    ...addReviewSection(serverShared.findings.filter((finding) => finding.layer === 'shared'), 'shared_packages'),
    ...addReviewSection(frontendIntegration.findings.filter((finding) => finding.layer === 'integration'), 'frontend_backend_integration'),
    ...addReviewSection(securityReadiness.findings.filter((finding) => finding.layer === 'security'), 'security_production_readiness'),
    ...addReviewSection(
      [...devProd.findings, ...securityReadiness.findings.filter((finding) => ['production', 'performance'].includes(finding.layer))],
      'security_production_readiness'
    )
  ]);

  const executiveJudgment = determineExecutiveJudgment(allFindings, confidenceModel);
  const gateVerdict = determineGateVerdict(allFindings, confidenceModel);
  const repairPriorityMap = buildRepairPriorityMap(allFindings);
  const actionPlan = buildFivePhaseActionPlan(allFindings);
  const requestContext = createReviewRequestContext({
    id: `review-${Date.now()}`,
    branch: options.branch || 'unknown-branch',
    source_command: 'syskit.review',
    feature_dir: featureDir,
    requested_output: reviewFile,
    required_artifacts: ['sys.md', 'plan.md', 'tasks.md'],
      requested_sections: [
        'Executive Summary',
        'Critical Issues Table',
        'Layer-by-Layer Findings',
      'Confidence and Coverage',
      'Repair Priority Map',
      'Action Plan'
    ],
    paths: {
      sys: options.sysFile,
      plan: options.planFile,
      tasks: options.tasksFile,
      review: reviewFile
    },
    metadata: {
      review_mode: confidenceModel.review_mode,
      confidence: confidenceModel.confidence
    }
  });

  return {
    generated_at: new Date().toISOString(),
    request_context: requestContext,
    gate_status: buildReviewGate(gateVerdict, allFindings),
    inventory: baseline.inventory,
    review_mode: confidenceModel.review_mode,
    confidence: confidenceModel.confidence,
    confidence_reasons: confidenceModel.reasons,
    executive_judgment: executiveJudgment,
    gate_verdict: gateVerdict,
    reviewed_artifacts: ['sys.md', 'plan.md', 'tasks.md'],
    evidence: [
      ...baseline.evidence,
      ...documentationDrift.evidence,
      ...devProd.evidence,
      ...editorSubtree.evidence,
      ...serverShared.evidence,
      ...frontendIntegration.evidence,
      ...securityReadiness.evidence
    ],
    automated_checks: baseline.automated_checks.results,
    skipped_layers: skippedLayers,
    findings: sortFindings(allFindings),
    critical_issues: sortFindings(allFindings.filter((finding) => ['critical', 'high'].includes(finding.severity))),
    sections: {
      toolchain_workspace: filterSectionFindings(allFindings, 'toolchain', ['toolchain', 'config', 'toolchain_workspace']),
      automated_checks: filterSectionFindings(allFindings, 'automated_checks'),
      documentation_drift: filterSectionFindings(allFindings, 'documentation_drift', ['documentation_drift']),
      frontend: filterSectionFindings(allFindings, 'frontend', ['frontend']),
      editor_subtree: filterSectionFindings(allFindings, 'editor_subtree', ['editor_subtree']),
      backend: filterSectionFindings(allFindings, 'backend', ['backend', 'server']),
      shared_packages: filterSectionFindings(allFindings, 'shared_packages', ['shared_packages', 'shared']),
      frontend_backend_integration: filterSectionFindings(allFindings, 'frontend_backend_integration', ['frontend_backend_integration', 'integration']),
      security_production_readiness: filterSectionFindings(allFindings, 'security_production_readiness', ['security_production_readiness', 'security', 'performance', 'production'])
    },
    coverage: buildCoverageSummary({
      baseline,
      confidenceModel,
      skippedLayers
    }),
    repair_priority_map: repairPriorityMap,
    action_plan: actionPlan
  };
}
