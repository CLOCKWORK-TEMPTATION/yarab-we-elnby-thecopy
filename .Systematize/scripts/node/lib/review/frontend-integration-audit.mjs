import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';
import { collectRepositoryFiles, readTextFile } from './repo-files.mjs';

function isCodeFile(filePath) {
  return /\.(?:[cm]?js|ts|tsx|jsx)$/i.test(filePath);
}

function isFrontendFile(filePath) {
  return /[\\/](app|frontend|pages|components|hooks)[\\/]/i.test(filePath);
}

function isBackendFile(filePath) {
  return /[\\/](backend|server|api)[\\/]/i.test(filePath) || /route\.(js|ts|mjs)$/i.test(filePath);
}

export function auditFrontendAndIntegration(repoRoot) {
  const evidence = [];
  const findings = [];
  const skipped_layers = [];
  const files = collectRepositoryFiles(repoRoot, { maxFiles: 800 });
  const frontendFiles = files
    .filter((filePath) => isCodeFile(filePath) && isFrontendFile(filePath))
    .map((filePath) => ({ filePath, content: readTextFile(filePath) }))
    .filter((item) => item.content);
  const backendFiles = files.filter((filePath) => isCodeFile(filePath) && isBackendFile(filePath));

  if (frontendFiles.length === 0) {
    skipped_layers.push({ layer: 'frontend', reason: 'No frontend layer was detected in the repository scan.' });
    skipped_layers.push({ layer: 'integration', reason: 'No frontend layer was detected, so UI-to-backend contract review was skipped.' });
    return { evidence, findings, skipped_layers };
  }

  for (const item of frontendFiles.slice(0, 50)) {
    if (/(useEffect\s*\(|fetch\(|axios\.)/i.test(item.content) && !/(loading|setLoading|error|setError)/i.test(item.content)) {
      findings.push(createFinding({
        id: `FD-FI-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'design_weakness',
        severity: 'medium',
        layer: 'frontend',
        location: item.filePath,
        problem: 'Frontend data flow lacks an explicit loading or error state.',
        evidence: 'The file fetches or reacts to async data without an obvious loading or error state branch.',
        impact: 'Users may see silent failures, stale screens, or inconsistent render behavior.',
        fix: 'Add explicit loading, empty, and error states for the async path in this component.'
      }));
    }

    if (/response\.json\(\)/i.test(item.content) && !/response\.ok|status\s*===/i.test(item.content)) {
      findings.push(createFinding({
        id: `FD-FI-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'potential_risk',
        severity: 'high',
        layer: 'integration',
        location: item.filePath,
        problem: 'Frontend integration path parses JSON without checking the response contract first.',
        evidence: 'The file calls response.json() without an obvious response.ok or status guard.',
        impact: 'Backend failures may surface as false-success UI states or opaque client crashes.',
        fix: 'Check response status before parsing JSON and normalize failure paths into explicit UI handling.'
      }));
    }

    if (/\/api\//i.test(item.content) && backendFiles.length === 0) {
      findings.push(createFinding({
        id: `FD-FI-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'potential_risk',
        severity: 'high',
        layer: 'integration',
        location: item.filePath,
        problem: 'Frontend depends on API routes that were not detected in the repository scan.',
        evidence: 'The file references /api/* endpoints while no backend layer was detected.',
        impact: 'The UI may depend on undocumented or missing server contracts.',
        fix: 'Document the missing backend contract or restore the server layer that owns the referenced endpoints.'
      }));
    }
  }

  evidence.push(createEvidenceRecord({
    id: 'EV-FI-001',
    source_type: 'directory',
    location: repoRoot,
    result: 'success',
    summary: `Scanned ${frontendFiles.length} frontend files and detected ${backendFiles.length} backend candidates for integration review.`
  }));

  if (backendFiles.length === 0) {
    skipped_layers.push({ layer: 'integration', reason: 'No backend layer was detected for a full frontend-backend contract comparison.' });
  }

  return { evidence, findings, skipped_layers };
}
