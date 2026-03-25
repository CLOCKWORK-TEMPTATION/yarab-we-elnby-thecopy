import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';
import { collectRepositoryFiles, readTextFile } from './repo-files.mjs';

function isCodeFile(filePath) {
  return /\.(?:[cm]?js|ts|tsx|jsx)$/i.test(filePath);
}

function classifyFile(filePath) {
  if (/[\\/](backend|server|api)[\\/]/i.test(filePath) || /route\.(js|ts|mjs)$/i.test(filePath)) {
    return 'server';
  }

  if (/[\\/](src|packages|lib|shared)[\\/]/i.test(filePath)) {
    return 'shared';
  }

  return null;
}

export function auditServerAndSharedLogic(repoRoot) {
  const evidence = [];
  const findings = [];
  const skipped_layers = [];
  const files = collectRepositoryFiles(repoRoot, { maxFiles: 800 });
  const classified = files
    .filter(isCodeFile)
    .map((filePath) => ({ filePath, layer: classifyFile(filePath), content: readTextFile(filePath) }))
    .filter((item) => item.layer && item.content);

  const serverFiles = classified.filter((item) => item.layer === 'server');
  const sharedFiles = classified.filter((item) => item.layer === 'shared');

  if (serverFiles.length === 0) {
    skipped_layers.push({ layer: 'server', reason: 'No server layer was detected in the repository scan.' });
  }

  if (sharedFiles.length === 0) {
    skipped_layers.push({ layer: 'shared', reason: 'No shared logic layer was detected in the repository scan.' });
  }

  for (const item of serverFiles.slice(0, 40)) {
    if (/(req\.|request\.|NextResponse|res\.)/.test(item.content) && !/(zod|safeParse|schema|validate|joi|valibot)/i.test(item.content)) {
      findings.push(createFinding({
        id: `FD-SS-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'potential_risk',
        severity: 'high',
        layer: 'server',
        location: item.filePath,
        problem: 'Server request handling appears to lack explicit runtime validation.',
        evidence: 'The file handles request or response objects without an obvious validation library or schema check.',
        impact: 'Invalid runtime inputs may cross the transport boundary and break downstream contracts.',
        fix: 'Introduce explicit runtime validation for request inputs and response shaping in the affected handler.'
      }));
    }

    if (/(req\.|request\.|NextResponse|res\.)/.test(item.content) && !/(try\s*{|\.catch\()/i.test(item.content)) {
      findings.push(createFinding({
        id: `FD-SS-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'design_weakness',
        severity: 'medium',
        layer: 'server',
        location: item.filePath,
        problem: 'Server handler appears to lack explicit error handling.',
        evidence: 'The file contains request-handling code without try/catch or promise catch handling.',
        impact: 'Operational failures may escape as inconsistent responses or unstructured runtime errors.',
        fix: 'Add explicit error handling and a consistent response contract for the affected handler.'
      }));
    }
  }

  for (const item of sharedFiles.slice(0, 60)) {
    if (/\bany\b/.test(item.content)) {
      findings.push(createFinding({
        id: `FD-SS-${String(findings.length + 1).padStart(3, '0')}`,
        type: 'design_weakness',
        severity: 'medium',
        layer: 'shared',
        location: item.filePath,
        problem: 'Shared logic uses the any type.',
        evidence: 'The file contains the any keyword in shared code.',
        impact: 'Type contracts may drift silently across layers that depend on this shared module.',
        fix: 'Replace any with narrower types or schema-backed parsing at the shared boundary.'
      }));
    }
  }

  evidence.push(createEvidenceRecord({
    id: 'EV-SS-001',
    source_type: 'directory',
    location: repoRoot,
    result: 'success',
    summary: `Scanned ${serverFiles.length} server files and ${sharedFiles.length} shared files.`
  }));

  return { evidence, findings, skipped_layers };
}
