function buildReason(message, evidence) {
  return { message, evidence };
}

export function deriveConfidenceModel({ checkResults = [], skippedLayers = [] } = {}) {
  const executed = checkResults.filter((item) => ['success', 'failure'].includes(item.status));
  const unavailable = checkResults.filter((item) => item.status === 'unavailable');
  const blocked = checkResults.filter((item) => item.status === 'blocked');

  if (executed.length === 0) {
    return {
      review_mode: 'Static Analysis Only',
      confidence: 'Low',
      reasons: [
        buildReason('No executable validation command completed successfully or unsuccessfully.', 'Only static repository evidence is available.')
      ]
    };
  }

  if (blocked.length > 0 || unavailable.length > 0 || skippedLayers.length > 0) {
    return {
      review_mode: 'Partial Execution Review',
      confidence: executed.length > 0 ? 'Medium' : 'Low',
      reasons: [
        ...blocked.map((item) => buildReason(`${item.name} could not be executed.`, item.stderr || item.command || 'No error output recorded.')),
        ...unavailable.map((item) => buildReason(`${item.name} is unavailable at the repository root.`, item.command || 'No command recorded.')),
        ...skippedLayers.map((item) => buildReason(`Layer ${item.layer} was skipped.`, item.reason))
      ]
    };
  }

  return {
    review_mode: 'Full Execution Review',
    confidence: 'High',
    reasons: []
  };
}
