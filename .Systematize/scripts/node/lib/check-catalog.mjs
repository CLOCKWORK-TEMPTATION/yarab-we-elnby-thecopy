export const AUDIT_CHECK_CATALOG = [
  {
    checkName: 'lint',
    scope: 'repo-root',
    allowedStatuses: ['executed', 'failed', 'blocked'],
    defaultConfidenceImpact: {
      executed: 'low',
      failed: 'high',
      blocked: 'medium'
    }
  },
  {
    checkName: 'type-check',
    scope: 'repo-root',
    allowedStatuses: ['executed', 'failed', 'blocked'],
    defaultConfidenceImpact: {
      executed: 'low',
      failed: 'high',
      blocked: 'high'
    }
  },
  {
    checkName: 'test',
    scope: 'repo-root',
    allowedStatuses: ['executed', 'failed', 'blocked'],
    defaultConfidenceImpact: {
      executed: 'low',
      failed: 'high',
      blocked: 'high'
    }
  },
  {
    checkName: 'build',
    scope: 'repo-root',
    allowedStatuses: ['executed', 'failed', 'blocked'],
    defaultConfidenceImpact: {
      executed: 'low',
      failed: 'high',
      blocked: 'high'
    }
  }
];

export const REQUIRED_CHECK_NAMES = AUDIT_CHECK_CATALOG.map((check) => check.checkName);

export function getCheckDefinition(checkName) {
  return AUDIT_CHECK_CATALOG.find((check) => check.checkName === checkName) || null;
}
