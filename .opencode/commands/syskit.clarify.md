---
description: Run the clarification phase — resolve ambiguity in the feature sys using targeted questions, document assumptions, produce a mandatory Clarification Contract, and verify readiness for planning.
command_name: clarify
command_family: Gate
command_stage: phase-02
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: strong-hybrid
runtime_command: setup-clarify
handoffs:
  - label: Generate Constitution
    agent: syskit.constitution
    prompt: Generate the project constitution based on the clarified sys
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for the mandatory clarification phase.

The heavy governing principles, ambiguity scan taxonomy, questioning protocol, integration rules, contract population, and validation rules have been extracted to:

```text
docs/policies/clarify-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for the clarification method.

Note: This clarification workflow is mandatory and must complete BEFORE invoking `/syskit.constitution`. The enforced workflow is: `/syskit.systematize` → `/syskit.clarify` → `/syskit.constitution` → `/syskit.research` → `/syskit.plan`.

## Execution Flow

1. **Setup**: Run the prerequisites check script from repo root once. Parse FEATURE_DIR and FEATURE_SYS. If JSON parsing fails, abort and instruct user to re-run `/syskit.systematize`.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --paths-only`

2. **Scan**: Load the current sys file. Perform the structured Ambiguity & Coverage Scan using the taxonomy in the policy file. Mark each category: Clear / Partial / Missing.

3. **Classify unknowns**: Follow the Unknown Classification process in the policy file. Separate critical unknowns (→ questions) from non-critical (→ assumptions) and deferred items.

4. **Generate questions**: Follow the Question Generation Rules in the policy file. Maximum 5 questions, prioritized by Impact × Uncertainty.

5. **Question loop**: Follow the Sequential Questioning Loop in the policy file. Present one question at a time with recommendations. Stop when all critical ambiguities are resolved, user signals completion, or 5 questions reached.

6. **Integrate answers**: After each accepted answer, follow the Integration protocol in the policy file. Update the sys file incrementally (atomic overwrites).

7. **Build contract**: Populate the Clarification Contract in the sys following the contract structure in the policy file: What Is Required, What Is NOT Required, Constraints, Assumptions, Critical Questions Resolved, Success Criteria, Clarification Checklist.

8. **Validate**: Follow the Validation Rules in the policy file. Verify no placeholders, no contradictions, all assumptions have ID/reason/impact, Markdown structure intact.

9. **Write**: Save the updated sys back to FEATURE_SYS.

10. **Report**: Output questions asked/answered count, assumptions documented, path to updated sys, sections touched, Clarification Contract status, coverage summary table, and suggested next command. Default to `/syskit.constitution` only when the Clarification Contract is complete; otherwise recommend re-running `/syskit.clarify`.

Context for prioritization: $ARGUMENTS

## Output

- **Primary format**: Interactive clarification flow followed by a completion summary in Markdown.
- **Files created or updated**: Active feature `sys.md`.
- **Success result**: Clarification Contract, resolved critical questions, documented assumptions, touched sections, and readiness status for planning.
- **Exit status**: `0` when the contract is updated successfully; `1` when `sys.md` is missing or critical ambiguity remains unresolved.
- **Failure conditions**: Missing feature context, invalid question answers after retry, contradictory requirements that cannot be reconciled, or save failures.
