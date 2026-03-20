import { join } from 'path';
import { getRepoRoot } from './common.mjs';

const WEB_BASE = ['apps', 'web', 'src', 'app', '(main)'];
const BACKEND_BASE = ['apps', 'backend', 'src'];

const WEB_TARGETS = [
  'brain-storm-ai',
  'BREAKAPP',
  'breakdown',
  'BUDGET',
  'cinematography-studio',
  'development',
  'directors-studio',
  'editor',
  'styleIST',
  'actorai-arabic',
  'analysis',
  'arabic-creative-writing-studio',
  'arabic-prompt-engineering-studio',
  'art-director',
  'brainstorm'
];

const BACKEND_TARGETS = [
  'queues',
  'scripts',
  'services',
  'test',
  'types',
  'utils',
  '__tests__',
  'agents',
  'config',
  'controllers',
  'db',
  'examples',
  'middleware'
];

const WEB_LAYERS = ['config', 'toolchain', 'frontend', 'integration', 'security', 'performance', 'production'];
const BACKEND_LAYERS = ['config', 'toolchain', 'server', 'shared', 'integration', 'security', 'performance', 'production'];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function buildTarget(targetType, relativeSegments, expectedLayers) {
  const repoRoot = getRepoRoot();
  const absolutePath = join(repoRoot, ...relativeSegments);
  const relativePath = normalizePath(join(...relativeSegments));

  return {
    path: absolutePath,
    relativePath,
    targetType,
    expectedLayers,
    coverageStatus: 'not_present',
    blockedReason: '',
    evidenceRef: ''
  };
}

export const AUDIT_TARGETS = [
  ...WEB_TARGETS.map((target) => buildTarget('web', [...WEB_BASE, target], WEB_LAYERS)),
  ...BACKEND_TARGETS.map((target) => buildTarget('backend', [...BACKEND_BASE, target], BACKEND_LAYERS))
];

export const AUDIT_TARGET_COUNT = AUDIT_TARGETS.length;

export function getAuditTargets() {
  return AUDIT_TARGETS.map((target) => ({ ...target, expectedLayers: [...target.expectedLayers] }));
}

export function getAuditTargetByPath(candidatePath) {
  const normalized = normalizePath(candidatePath);
  return AUDIT_TARGETS.find((target) =>
    normalizePath(target.path) === normalized || target.relativePath === normalized
  ) || null;
}
