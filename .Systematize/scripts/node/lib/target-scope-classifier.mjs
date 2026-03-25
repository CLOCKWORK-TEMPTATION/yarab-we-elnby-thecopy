import { getAuditTargetByPath } from './audit-target-registry.mjs';

export const CANONICAL_LAYERS = Object.freeze([
  'config',
  'toolchain',
  'server',
  'shared',
  'frontend',
  'integration',
  'security',
  'performance',
  'production'
]);

export const TARGET_LAYER_PROFILES = Object.freeze({
  web: ['config', 'toolchain', 'frontend', 'integration', 'security', 'performance', 'production'],
  backend: ['config', 'toolchain', 'server', 'shared', 'integration', 'security', 'performance', 'production'],
  'shared-linked': ['config', 'toolchain', 'shared', 'integration', 'security', 'performance', 'production']
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toUniqueLayerList(values = []) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function normalizeReasonMap(reasonMap = {}) {
  return Object.fromEntries(
    Object.entries(reasonMap).map(([key, value]) => [key, cleanText(value)])
  );
}

export function classifyTargetScope(target, options = {}) {
  if (!target || typeof target !== 'object') {
    throw new Error('A target record is required for scope classification.');
  }

  const targetType = cleanText(target.targetType) || 'shared-linked';
  const expectedLayers = toUniqueLayerList(
    target.expectedLayers && target.expectedLayers.length > 0
      ? target.expectedLayers
      : TARGET_LAYER_PROFILES[targetType] || TARGET_LAYER_PROFILES['shared-linked']
  );
  const inspectedLayers = toUniqueLayerList(options.inspectedLayers || []);
  const blockedLayers = toUniqueLayerList(options.blockedLayers || []);
  const blockedReasons = normalizeReasonMap(options.blockedReasons);
  const notPresentReasons = normalizeReasonMap(options.notPresentReasons);
  const globalBlockedReason = cleanText(options.blockedReason);

  const layerStates = CANONICAL_LAYERS.map((layer) => {
    if (!expectedLayers.includes(layer)) {
      return { layer, status: 'out_of_scope', reason: 'Layer is خارج نطاق الهدف الحالي.' };
    }

    if (blockedLayers.includes(layer)) {
      return {
        layer,
        status: 'blocked',
        reason: blockedReasons[layer] || globalBlockedReason || 'Layer inspection was blocked.'
      };
    }

    if (inspectedLayers.includes(layer)) return { layer, status: 'inspected', reason: '' };

    return {
      layer,
      status: 'not_present',
      reason: notPresentReasons[layer] || 'No usable evidence was collected for this expected layer.'
    };
  });

  const blockedExpectedLayers = layerStates
    .filter((entry) => entry.status === 'blocked')
    .map((entry) => entry.layer);
  const notPresentLayers = layerStates
    .filter((entry) => entry.status === 'not_present')
    .map((entry) => entry.layer);
  const overallStatus = blockedExpectedLayers.length > 0
    ? 'blocked'
    : inspectedLayers.length > 0 && notPresentLayers.length === 0
      ? 'inspected'
      : inspectedLayers.length > 0
        ? 'blocked'
        : 'not_present';

  const inferredBlockedReason = blockedExpectedLayers.length > 0
    ? blockedExpectedLayers.map((layer) => blockedReasons[layer] || globalBlockedReason || `${layer} blocked`).join('; ')
    : inspectedLayers.length > 0 && notPresentLayers.length > 0
      ? `Partial layer coverage: ${notPresentLayers.join(', ')}`
      : cleanText(target.blockedReason);

  return {
    path: cleanText(target.path),
    relativePath: cleanText(target.relativePath),
    targetType,
    expectedLayers,
    coverageStatus: overallStatus,
    blockedReason: inferredBlockedReason,
    inspectedLayers: layerStates.filter((entry) => entry.status === 'inspected').map((entry) => entry.layer),
    blockedLayers: blockedExpectedLayers,
    outOfScopeLayers: layerStates.filter((entry) => entry.status === 'out_of_scope').map((entry) => entry.layer),
    notPresentLayers,
    layerStates
  };
}

export function classifyTargetByPath(candidatePath, options = {}) {
  const target = getAuditTargetByPath(candidatePath);
  if (!target) throw new Error(`Unknown audit target path: ${candidatePath}`);
  return classifyTargetScope(target, options);
}
