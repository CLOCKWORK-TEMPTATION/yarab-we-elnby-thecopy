import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';
import { collectRepositoryFiles, readTextFile } from './repo-files.mjs';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function containsHardcodedSecret(content) {
  return [
    /(API_KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*['"][^'"]+['"]/i,
    /_authToken\s*=\s*[^\s#]+/i,
    /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i
  ].some((pattern) => pattern.test(content));
}

export function auditSecurityAndReadiness(repoRoot) {
  const evidence = [];
  const findings = [];
  const files = collectRepositoryFiles(repoRoot, { maxFiles: 1000 });
  const textFiles = files.map((filePath) => ({ filePath, content: readTextFile(filePath) })).filter((item) => item.content);
  const packageJsonPath = join(repoRoot, 'package.json');
  const packageJson = existsSync(packageJsonPath) ? safeReadJson(packageJsonPath) : null;
  const packageText = JSON.stringify(packageJson || {});

  const hardcodedSecret = textFiles.find((item) => containsHardcodedSecret(item.content));
  if (hardcodedSecret) {
    findings.push(createFinding({
      id: 'FD-SR-001',
      type: 'confirmed_error',
      severity: 'critical',
      layer: 'security',
      location: hardcodedSecret.filePath,
      problem: 'Tracked source appears to contain a hardcoded secret or token.',
      evidence: 'The file matches a hardcoded credential pattern.',
      impact: 'Sensitive credentials may leak through source control or generated artifacts.',
      fix: 'Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source.'
    }));
  }

  if (existsSync(join(repoRoot, '.env')) && !existsSync(join(repoRoot, '.env.example'))) {
    findings.push(createFinding({
      id: 'FD-SR-002',
      type: 'potential_risk',
      severity: 'high',
      layer: 'security',
      location: join(repoRoot, '.env'),
      problem: 'Tracked environment assumptions exist without a sanitized example contract.',
      evidence: 'A root .env file exists while .env.example is absent.',
      impact: 'Runtime secrets or local assumptions may drift invisibly across environments.',
      fix: 'Track only sanitized examples and document the required runtime variables explicitly.'
    }));
  }

  const validationLibrariesPresent = /(zod|joi|valibot|yup)/i.test(packageText)
    || textFiles.some((item) => /(zod|joi|valibot|yup)/i.test(item.content));
  if (!validationLibrariesPresent) {
    findings.push(createFinding({
      id: 'FD-SR-003',
      type: 'potential_risk',
      severity: 'high',
      layer: 'security',
      location: packageJsonPath,
      problem: 'No obvious runtime validation layer was detected in the repository.',
      evidence: 'Package metadata and scanned source files do not reference common runtime validation libraries or schemas.',
      impact: 'Typed code may still accept unsafe runtime inputs at sensitive boundaries.',
      fix: 'Add a runtime validation contract for request, config, and integration boundaries.'
    }));
  }

  const observabilityPresent = /(sentry|opentelemetry|prometheus|winston|pino)/i.test(packageText)
    || textFiles.some((item) => /(Sentry|OpenTelemetry|Prometheus|winston|pino)/i.test(item.content));
  if (!observabilityPresent) {
    findings.push(createFinding({
      id: 'FD-SR-004',
      type: 'design_weakness',
      severity: 'medium',
      layer: 'production',
      location: repoRoot,
      problem: 'No obvious observability or structured logging layer was detected.',
      evidence: 'The repository scan did not find common telemetry or structured logging integrations.',
      impact: 'Production failures may remain hard to diagnose after deployment.',
      fix: 'Add structured logging and at least one observability path for runtime incidents.'
    }));
  }

  evidence.push(createEvidenceRecord({
    id: 'EV-SR-001',
    source_type: 'directory',
    location: repoRoot,
    result: 'success',
    summary: `Scanned ${textFiles.length} readable files for security and readiness indicators.`
  }));

  return { evidence, findings };
}
