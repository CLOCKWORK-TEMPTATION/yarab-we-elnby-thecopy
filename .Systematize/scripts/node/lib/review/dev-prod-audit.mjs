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

export function auditDevProductionBoundaries(repoRoot) {
  const evidence = [];
  const findings = [];
  const packageJsonPath = join(repoRoot, 'package.json');
  const packageJson = existsSync(packageJsonPath) ? safeReadJson(packageJsonPath) : null;
  const scripts = packageJson?.scripts || {};
  const envLocalPath = join(repoRoot, '.env.local');
  const envExamplePath = join(repoRoot, '.env.example');

  if (existsSync(envLocalPath)) {
    evidence.push(createEvidenceRecord({
      id: 'EV-DP-001',
      source_type: 'file',
      location: envLocalPath,
      result: 'success',
      summary: 'Found repository-level .env.local file.'
    }));

    if (!existsSync(envExamplePath)) {
      findings.push(createFinding({
        id: 'FD-DP-001',
        type: 'potential_risk',
        severity: 'medium',
        layer: 'production',
        location: envLocalPath,
        problem: 'Repository relies on .env.local without a checked-in example contract.',
        evidence: 'A root .env.local file exists but .env.example is missing.',
        impact: 'Local development assumptions may not translate to CI, build, or production environments.',
        fix: 'Add a sanitized .env.example or document the mandatory environment variables explicitly.'
      }));
    }
  }

  if (scripts.dev && !scripts.build) {
    findings.push(createFinding({
      id: 'FD-DP-002',
      type: 'confirmed_error',
      severity: 'high',
      layer: 'production',
      location: packageJsonPath,
      problem: 'Repository exposes a dev script without a matching build script.',
      evidence: 'package.json contains dev but not build at the root.',
      impact: 'The project may succeed in development while lacking a reproducible production build path.',
      fix: 'Add a root build script or document the authoritative build entrypoint used in production.'
    }));
  }

  if (scripts.build && !scripts.start && !scripts.preview) {
    findings.push(createFinding({
      id: 'FD-DP-003',
      type: 'design_weakness',
      severity: 'low',
      layer: 'production',
      location: packageJsonPath,
      problem: 'Repository has a build command without a start or preview contract at the root.',
      evidence: 'package.json contains build but neither start nor preview.',
      impact: 'Production readiness remains harder to verify from the top-level workflow alone.',
      fix: 'Expose a root start or preview command or document why execution is intentionally delegated elsewhere.'
    }));
  }

  return { evidence, findings };
}
