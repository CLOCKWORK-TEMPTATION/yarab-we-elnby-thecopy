import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidenceRecord } from './evidence-schema.mjs';
import { createFinding } from './finding-schema.mjs';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function auditEditorSubtree(repoRoot) {
  const evidence = [];
  const findings = [];
  const skipped_layers = [];

  const webRoot = join(repoRoot, 'apps', 'web');
  const editorRoot = join(webRoot, 'src', 'app', '(main)', 'editor');
  const webPackageJsonPath = join(webRoot, 'package.json');
  const webTsconfigPath = join(webRoot, 'tsconfig.json');
  const editorPackageJsonPath = join(editorRoot, 'package.json');
  const editorNextConfigPath = join(editorRoot, 'next.config.ts');
  const editorViteConfigPath = join(editorRoot, 'vite.config.ts');
  const editorServerPath = join(editorRoot, 'server', 'file-import-server.mjs');

  if (!existsSync(editorRoot)) {
    skipped_layers.push({
      layer: 'editor_subtree',
      reason: 'apps/web/src/app/(main)/editor was not detected in the repository scan.'
    });
    return { evidence, findings, skipped_layers };
  }

  const webPackageJson = safeReadJson(webPackageJsonPath) || {};
  const webTsconfig = safeReadJson(webTsconfigPath) || {};
  const editorPackageJson = safeReadJson(editorPackageJsonPath);
  const editorExcludes = Array.isArray(webTsconfig.exclude)
    ? webTsconfig.exclude.filter((entry) => String(entry).includes('src/app/(main)/editor'))
    : [];
  const devScript = String(webPackageJson.scripts?.dev || '');

  evidence.push(createEvidenceRecord({
    id: 'EV-ED-001',
    source_type: 'directory',
    location: editorRoot,
    result: 'success',
    summary: 'Detected the editor subtree inside apps/web for mandatory deep audit.'
  }));

  evidence.push(createEvidenceRecord({
    id: 'EV-ED-002',
    source_type: 'config',
    location: webTsconfigPath,
    result: existsSync(webTsconfigPath) ? 'success' : 'failure',
    summary: existsSync(webTsconfigPath)
      ? `apps/web tsconfig excludes ${editorExcludes.length} editor-specific paths.`
      : 'apps/web tsconfig.json is missing.'
  }));

  evidence.push(createEvidenceRecord({
    id: 'EV-ED-003',
    source_type: 'file',
    location: webPackageJsonPath,
    result: existsSync(webPackageJsonPath) ? 'success' : 'failure',
    summary: 'Loaded apps/web package.json to inspect how dev mode wires the editor subtree.'
  }));

  const devUsesEditorServer = devScript.includes('src/app/(main)/editor/server/file-import-server.mjs');
  if (devUsesEditorServer && editorExcludes.length > 0) {
    findings.push(createFinding({
      id: 'FD-ED-001',
      type: 'execution_gap',
      severity: 'high',
      layer: 'editor_subtree',
      location: `${webPackageJsonPath} | ${webTsconfigPath}`,
      problem: 'apps/web dev mode executes editor server code that the official apps/web type-check excludes.',
      evidence: `apps/web package.json dev script runs ${'src/app/(main)/editor/server/file-import-server.mjs'} while apps/web tsconfig exclude lists ${editorExcludes.join(', ')}.`,
      impact: 'The official frontend development path can execute editor code that never passes through the advertised type-check boundary.',
      fix: 'Either include the editor subtree in apps/web type-check coverage or promote it to an explicitly separate workspace with its own required validation commands.'
    }));
  }

  if (editorPackageJson && existsSync(editorNextConfigPath) && existsSync(editorViteConfigPath)) {
    findings.push(createFinding({
      id: 'FD-ED-002',
      type: 'design_weakness',
      severity: 'medium',
      layer: 'editor_subtree',
      location: `${editorPackageJsonPath} | ${editorNextConfigPath} | ${editorViteConfigPath}`,
      problem: 'The editor subtree still carries a nested app manifest plus both Next and Vite build configuration files.',
      evidence: 'apps/web/src/app/(main)/editor contains package.json, next.config.ts, and vite.config.ts in the same subtree.',
      impact: 'The subtree still resembles a previously standalone application, which makes its build ownership and integration boundary harder to verify.',
      fix: 'Document the authoritative editor runtime boundary and keep only the build contracts that remain active inside apps/web.'
    }));
  }

  if (editorPackageJson && !existsSync(editorServerPath)) {
    findings.push(createFinding({
      id: 'FD-ED-003',
      type: 'confirmed_error',
      severity: 'high',
      layer: 'editor_subtree',
      location: editorRoot,
      problem: 'The editor subtree declares standalone runtime scripts but the expected file-import server entrypoint is missing.',
      evidence: 'Editor package.json exists, but server/file-import-server.mjs was not found.',
      impact: 'The integrated apps/web dev command would point at a missing editor runtime dependency.',
      fix: 'Restore the referenced editor server entrypoint or remove the broken integration path from apps/web dev mode.'
    }));
  }

  return { evidence, findings, skipped_layers };
}
