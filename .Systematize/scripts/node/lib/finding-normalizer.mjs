const ALLOWED_TYPES = new Set(['خطأ مؤكد', 'خطر محتمل', 'ضعف تصميمي', 'تحسين مقترح']);
const ALLOWED_SEVERITIES = new Set(['حرج', 'عالٍ', 'متوسط', 'منخفض']);
const ALLOWED_LAYERS = new Set(['config', 'toolchain', 'server', 'shared', 'frontend', 'integration', 'security', 'performance', 'production']);
const SEVERITY_WEIGHT = new Map([
  ['حرج', 4],
  ['عالٍ', 3],
  ['متوسط', 2],
  ['منخفض', 1]
]);

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildMergeKey(record) {
  return [
    record.type,
    record.layer,
    record.problem.toLowerCase(),
    record.fix.toLowerCase()
  ].join('::');
}

export function normalizeFindingRecord(record) {
  const finding = {
    findingId: sanitizeText(record?.findingId),
    type: sanitizeText(record?.type),
    severity: sanitizeText(record?.severity),
    layer: sanitizeText(record?.layer),
    location: sanitizeText(record?.location),
    problem: sanitizeText(record?.problem),
    evidence: sanitizeText(record?.evidence),
    impact: sanitizeText(record?.impact),
    fix: sanitizeText(record?.fix),
    mergedFrom: Array.isArray(record?.mergedFrom) ? [...new Set(record.mergedFrom.filter(Boolean).map(sanitizeText))] : []
  };

  if (!finding.findingId) throw new Error('findingId is required');
  if (!ALLOWED_TYPES.has(finding.type)) throw new Error(`Unsupported finding type: ${finding.type}`);
  if (!ALLOWED_SEVERITIES.has(finding.severity)) throw new Error(`Unsupported severity: ${finding.severity}`);
  if (!ALLOWED_LAYERS.has(finding.layer)) throw new Error(`Unsupported layer: ${finding.layer}`);

  for (const field of ['location', 'problem', 'evidence', 'impact', 'fix']) {
    if (!finding[field]) {
      throw new Error(`${field} is required for finding ${finding.findingId}`);
    }
  }

  return finding;
}

export function mergeFindings(records = []) {
  const merged = new Map();

  for (const rawRecord of records) {
    const record = normalizeFindingRecord(rawRecord);
    const key = buildMergeKey(record);
    const current = merged.get(key);

    if (!current) {
      merged.set(key, {
        ...record,
        mergedFrom: record.mergedFrom.length > 0 ? record.mergedFrom : [record.findingId]
      });
      continue;
    }

    const currentWeight = SEVERITY_WEIGHT.get(current.severity) || 0;
    const nextWeight = SEVERITY_WEIGHT.get(record.severity) || 0;

    merged.set(key, {
      ...current,
      severity: nextWeight > currentWeight ? record.severity : current.severity,
      evidence: current.evidence === record.evidence ? current.evidence : `${current.evidence}\n---\n${record.evidence}`,
      location: current.location === record.location ? current.location : `${current.location}; ${record.location}`,
      mergedFrom: [...new Set([...current.mergedFrom, record.findingId, ...record.mergedFrom])]
    });
  }

  return Array.from(merged.values());
}
