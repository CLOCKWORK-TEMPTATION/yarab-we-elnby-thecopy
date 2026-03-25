const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const TYPE_ORDER = {
  confirmed_error: 0,
  potential_risk: 1,
  design_weakness: 2,
  suggested_improvement: 3
};

function choosePreferred(left, right, orderMap) {
  return (orderMap[left] ?? 99) <= (orderMap[right] ?? 99) ? left : right;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function buildNormalizationKey(finding) {
  return [
    normalizeText(finding.problem),
    normalizeText(finding.impact),
    normalizeText(finding.fix)
  ].join('::');
}

export function normalizeFindings(findings = []) {
  const merged = new Map();

  for (const finding of findings) {
    const key = buildNormalizationKey(finding);

    if (!merged.has(key)) {
      merged.set(key, {
        ...finding,
        merged_locations: [finding.location],
        merged_layers: [finding.layer],
        review_sections: [finding.review_section].filter(Boolean)
      });
      continue;
    }

    const current = merged.get(key);
    current.severity = choosePreferred(current.severity, finding.severity, SEVERITY_ORDER);
    current.type = choosePreferred(current.type, finding.type, TYPE_ORDER);
    current.evidence = [current.evidence, finding.evidence].filter(Boolean).join('\n---\n');
    current.merged_locations = [...new Set([...current.merged_locations, finding.location])];
    current.merged_layers = [...new Set([...current.merged_layers, finding.layer])];
    current.review_sections = [...new Set([...(current.review_sections || []), finding.review_section].filter(Boolean))];
    current.location = current.merged_locations.join(' | ');
  }

  return [...merged.values()];
}
