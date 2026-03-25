---
description: "Generate a deep, structured research plan and execute research for a feature concept — covering problem validation, user behavior, market analysis, technical feasibility, risk assessment, and go/no-go recommendation. Produces research.md using the 13-section research template with 5-phase methodology (Decompose → Survey → Deepen → Synthesize → Recommend)."
command_name: research
command_family: Gate
command_stage: phase-04
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: runtime-backed
runtime_command: setup-research
handoffs:
  - label: Create Implementation Plan
    agent: syskit.plan
    prompt: Create the implementation plan based on research findings
  - label: Update Sys
    agent: syskit.systematize
    prompt: Update the sys based on research findings
  - label: Run Clarification
    agent: syskit.clarify
    prompt: Clarify unknowns discovered during research
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for research planning and evidence synthesis.

The heavy policy, question framework, evidence rules, and report structure have been extracted to:

```text
docs/policies/research-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for research behavior and output quality.

## Runtime Bridge

Use the canonical Node runtime helper to initialize the active feature context and target paths:

```text
node .Systematize/scripts/node/cli.mjs setup-research --json
```

PowerShell remains a compatibility shell only.

## Execution Flow

1. Load and follow the extracted research policy before gathering evidence or drafting conclusions.
2. Run the canonical runtime bootstrap once to resolve the active feature workspace and output paths.
3. Use `sys.md` and the constitution as governing inputs, then execute the evidence-gathering workflow defined by the policy file.
4. Write `research.md` to the resolved feature workspace and keep all claims evidence-based or explicitly marked as inference.
5. If the constitution or `sys.md` is missing or incomplete, fail and direct the user to the proper prior gate.

## Output

- Deliver the completed `research.md` path and the decision verdict.
- Summarize the main research findings, open risks, and confidence level.
- Cite the extracted policy file used for the run.
