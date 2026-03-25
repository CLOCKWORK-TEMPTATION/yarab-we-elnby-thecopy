import { scanRepositoryInventory } from './inventory-scan.mjs';
import { renderReviewSummary } from './render-summary.mjs';
import { runAutomatedChecks } from './automated-checks.mjs';
import { auditToolchain } from './toolchain-audit.mjs';
import { createFinding } from './finding-schema.mjs';

export function determineReviewMode(checkResults) {
  const executed = checkResults.filter((item) => ['success', 'failure', 'blocked'].includes(item.status));
  if (executed.length === 0) return 'Static Analysis Only';
  if (executed.some((item) => item.status === 'blocked')) return 'Partial Execution Review';
  return 'Full Execution Review';
}

export function inferAutomatedCheckFindings(checkResults) {
  const findings = [];

  for (const result of checkResults) {
    if (result.status !== 'failure') continue;

    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    let problem = `${result.name} failed during automated validation.`;
    let impact = 'The repository cannot be considered ready for new development until the failure is explained and resolved.';
    let fix = `Inspect and repair the ${result.name} command before relying on the governance gate.`;

    if (/ERR_MODULE_NOT_FOUND|Cannot find module|Module not found/i.test(combinedOutput)) {
      problem = `${result.name} failed because a runtime dependency or import target is missing.`;
      impact = 'The validation chain is broken structurally rather than failing on business logic alone.';
      fix = 'Restore the missing import target or dependency and rerun the affected command.';
    } else if (/not found|ENOENT/i.test(combinedOutput)) {
      problem = `${result.name} failed because the command depends on a missing file or binary.`;
      impact = 'The governance gate cannot distinguish product defects from environment drift until the dependency is restored.';
      fix = 'Restore the missing file or binary and document the prerequisite explicitly.';
    }

    findings.push(createFinding({
      id: `FD-P1-${String(findings.length + 1).padStart(3, '0')}`,
      type: 'confirmed_error',
      severity: 'high',
      layer: 'toolchain',
      location: result.command || result.name,
      problem,
      evidence: combinedOutput.trim().slice(0, 4000) || `${result.name} exited with a non-zero code.`,
      impact,
      fix
    }));
  }

  return findings;
}

export function runP1BaselineReview(repoRoot, options = {}) {
  const inventory = scanRepositoryInventory(repoRoot);
  const toolchain = auditToolchain(repoRoot, inventory);
  const automatedChecks = runAutomatedChecks(repoRoot, options);
  const checkFindings = inferAutomatedCheckFindings(automatedChecks.results);
  const allFindings = [...toolchain.findings, ...checkFindings];
  const incompleteChecks = automatedChecks.results
    .filter((item) => item.status === 'unavailable' || item.status === 'blocked')
    .map((item) => item.name);

  return {
    review_mode: determineReviewMode(automatedChecks.results),
    confidence: incompleteChecks.length > 0 ? 'Medium' : 'High',
    inventory,
    toolchain,
    automated_checks: automatedChecks,
    incomplete_checks: incompleteChecks,
    evidence: [...toolchain.evidence, ...automatedChecks.evidence],
    findings: allFindings,
    summary: renderReviewSummary({
      reviewMode: determineReviewMode(automatedChecks.results),
      confidence: incompleteChecks.length > 0 ? 'Medium' : 'High',
      detectedLayers: inventory.detected_layers,
      findings: allFindings,
      incompleteChecks
    })
  };
}
