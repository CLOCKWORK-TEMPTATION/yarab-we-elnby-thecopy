---
description: Analyze project metrics across all features — estimation accuracy, clarification efficiency, risk prediction, and rework rate.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Read `.Systematize/memory/analytics.json` for event data.

2. Run `get-feature-status.ps1 -Json` / `node cli.mjs feature-status --json` for each feature found via `Get-AllFeatureDirs`.

3. **Calculate metrics**:

   **Estimation Accuracy**: Compare estimated hours (from tasks.md) vs actual completion time (from analytics events)

   **Clarification Efficiency**: Count questions asked vs questions that changed decisions

   **Risk Prediction**: Compare identified risks vs materialized risks

   **Rework Rate**: Count features with rework events / total features

4. **Present report**:
   ```
   📊 Project Metrics (across all features)

   Features Tracked: [X]

   Phase Distribution:
   ├── Systematize: [X] features
   ├── Plan: [X] features
   ├── Implementation: [X] features
   └── Complete: [X] features

   Health Scores:
   ├── Average: [X]/100
   ├── Best: [branch] ([X])
   └── Worst: [branch] ([X])

   Rework Rate: [X]% ([Y] of [Z] features)
   Most Reworked Phase: [phase] ([X] times)
   ```

5. If no analytics data exists, suggest running `/syskit.status` on existing features to seed data.

## Rules

- Only report metrics with actual data — don't estimate
- Compare across features for benchmarking
- Highlight anomalies and outliers
- Suggest improvements based on patterns

## Output

- **Primary format**: Portfolio-level metrics report in Markdown.
- **Files created or updated**: None.
- **Success result**: Feature counts, phase distribution, health distribution, rework indicators, and evidence-based improvement suggestions.
- **Exit status**: `0` when analytics and feature state can be aggregated; `1` when analytics storage is unreadable or no valid feature set can be analyzed.
- **Failure conditions**: Corrupt analytics data, unreadable status reports, or incompatible metric inputs.
