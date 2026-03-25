import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getScriptName(scripts = {}, candidates = []) {
  return candidates.find((candidate) => scripts[candidate]);
}

export function auditToolchain(repoRoot, inventory) {
  const evidence = [];
  const findings = [];
  const packageJsonPath = join(repoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    evidence.push(createEvidenceRecord({
      id: 'EV-TC-001',
      source_type: 'file',
      location: packageJsonPath,
      result: 'failure',
      summary: 'package.json is missing at the repository root.'
    }));

    findings.push(createFinding({
      id: 'FD-TC-001',
      type: 'confirmed_error',
      severity: 'critical',
      layer: 'toolchain',
      location: packageJsonPath,
      problem: 'Repository root has no package.json file.',
      evidence: 'The review could not load package scripts or dependency metadata.',
      impact: 'Toolchain validation and command execution cannot be trusted.',
      fix: 'Restore a valid package.json at the repository root or route the review to the real project root.'
    }));

    return { evidence, findings };
  }

  const packageJson = safeReadJson(packageJsonPath);
  const scripts = packageJson?.scripts || {};

  evidence.push(createEvidenceRecord({
    id: 'EV-TC-002',
    source_type: 'file',
    location: packageJsonPath,
    result: 'success',
    summary: 'Loaded root package.json for toolchain inspection.'
  }));

  const requiredScripts = [
    ['lint', ['lint']],
    ['type-check', ['typecheck', 'type-check']],
    ['test', ['test']],
    ['build', ['build']]
  ];

  for (const [label, candidates] of requiredScripts) {
    const resolved = getScriptName(scripts, candidates);
    if (resolved) continue;

    findings.push(createFinding({
      id: `FD-TC-${String(findings.length + 3).padStart(3, '0')}`,
      type: 'design_weakness',
      severity: label === 'test' || label === 'build' ? 'high' : 'medium',
      layer: 'toolchain',
      location: packageJsonPath,
      problem: `Missing root ${label} script.`,
      evidence: `Root package.json scripts do not expose any of: ${candidates.join(', ')}.`,
      impact: 'The strict review cannot execute the expected validation chain deterministically.',
      fix: `Add a root ${label} script or document the authoritative alternative command in the governance layer.`
    }));
  }

  const tsconfigPath = join(repoRoot, 'tsconfig.json');
  if (existsSync(tsconfigPath)) {
    const tsconfig = safeReadJson(tsconfigPath);
    evidence.push(createEvidenceRecord({
      id: 'EV-TC-003',
      source_type: 'config',
      location: tsconfigPath,
      result: tsconfig ? 'success' : 'failure',
      summary: tsconfig ? 'Parsed tsconfig.json.' : 'tsconfig.json could not be parsed as JSON.'
    }));

    if (tsconfig?.compilerOptions?.strict === false) {
      findings.push(createFinding({
        id: `FD-TC-${String(findings.length + 3).padStart(3, '0')}`,
        type: 'potential_risk',
        severity: 'high',
        layer: 'shared',
        location: tsconfigPath,
        problem: 'TypeScript strict mode is disabled at the root.',
        evidence: 'compilerOptions.strict is explicitly set to false.',
        impact: 'Static analysis may miss contract drift across shared modules.',
        fix: 'Enable strict mode or split exceptions into narrow per-package overrides.'
      }));
    }
  }

  const nextDependencyPresent = Boolean(
    packageJson?.dependencies?.next || packageJson?.devDependencies?.next
  );
  if (nextDependencyPresent && !inventory.governance_files.next_config) {
    findings.push(createFinding({
      id: `FD-TC-${String(findings.length + 3).padStart(3, '0')}`,
      type: 'design_weakness',
      severity: 'low',
      layer: 'toolchain',
      location: repoRoot,
      problem: 'Next.js is present without a root next.config file.',
      evidence: 'Dependencies include next but no next.config.js/mjs/ts was found at the root.',
      impact: 'Build and runtime assumptions may stay implicit instead of being documented explicitly.',
      fix: 'Add a root next.config file or document why the repository intentionally relies on framework defaults.'
    }));
  }

  return { evidence, findings };
}
