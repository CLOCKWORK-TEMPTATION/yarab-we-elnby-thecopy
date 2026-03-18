---
name: claude-code-security-reviewer
description: Automated security code review for GitHub pull requests using Claude. Use when setting up strict engineering code review automation, configuring security scanning for multiple languages, or implementing AI-powered vulnerability detection in CI/CD pipelines.
---

# Claude Code Security Reviewer

Automated AI-powered security review for GitHub pull requests across multiple programming languages and frameworks.

## When to Apply

- Setting up automated security review in GitHub Actions workflows
- Configuring custom security rules for specific tech stacks
- Implementing strict engineering code review with false positive filtering
- Adding AI-powered vulnerability detection to existing CI/CD pipelines

## Critical Rules

**Required Permissions**: Action needs specific GitHub permissions to comment on pull requests

```yaml
# WRONG - Missing pull request write permission
permissions:
  contents: read

# RIGHT - Includes required permissions for PR comments
permissions:
  pull-requests: write
  contents: read
```

**Fetch Depth**: Must fetch at least 2 commits to analyze code changes

```yaml
# WRONG - Default shallow clone misses diff context
- uses: actions/checkout@v4

# RIGHT - Fetch depth 2 enables proper diff analysis
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha || github.sha }}
    fetch-depth: 2
```

## Key Patterns

### Basic Security Review Workflow

```yaml
name: Security Review

permissions:
  pull-requests: write
  contents: read

on:
  pull_request:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
          fetch-depth: 2
      
      - uses: anthropics/claude-code-security-review@main
        with:
          comment-pr: true
          claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
```

### Custom Security Categories

```yaml
- uses: anthropics/claude-code-security-review@main
  with:
    custom-security-scan-instructions: .github/custom-security-categories.txt
    claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
```

Create `.github/custom-security-categories.txt`:
```text
**GraphQL Security:**
- Query depth attacks allowing unbounded recursion
- Field-level authorization bypass
- Introspection data leakage in production

**Payment Processing:**
- Transaction replay vulnerabilities
- Currency conversion manipulation
- Refund process bypass

**GDPR Compliance:**
- Personal data processing without consent mechanisms
- Missing data retention limits
- Lack of data portability APIs
```

### False Positive Filtering

```yaml
- uses: anthropics/claude-code-security-review@main
  with:
    false-positive-filtering-instructions: .github/false-positive-filtering.txt
    claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
```

## Common Mistakes

- **Missing API key secret** — Add `CLAUDE_API_KEY` to repository secrets
- **Wrong checkout ref** — Use `github.event.pull_request.head.sha` for PR analysis
- **Insufficient permissions** — Action fails silently without `pull-requests: write`
- **Shallow clone** — Default checkout misses code diff context needed for analysis