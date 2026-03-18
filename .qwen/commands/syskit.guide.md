---
description: Interactive tutorial that explains the Systematize KIT workflow and guides users to their next step based on current project state.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. **Determine user level** from `$ARGUMENTS`:
   - If specified (beginner/intermediate/advanced), use that
   - Otherwise, ask: "What's your experience level with Systematize KIT?"

2. **Show system overview** based on level:

   **Beginner**: Full explanation of the 10-command workflow with examples
   **Intermediate**: Quick reference of commands with tips
   **Advanced**: Just the current status and optimization suggestions

3. Run the feature status script to determine current state.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/get-feature-status.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs feature-status --json`

4. **Explain the next step**:
   - What the next command does
   - What inputs it needs
   - What outputs it produces
   - Common mistakes to avoid
   - Example invocation

5. **Offer to run it**: "Would you like me to run `[next command]` now?"

## Rules

- Be conversational and helpful, not technical
- Use examples from the user's actual project when possible
- Don't overwhelm beginners with advanced features
- Always end with a clear, actionable next step

## Output

- **Primary format**: Conversational Markdown guidance tailored to the current workflow stage.
- **Files created or updated**: None unless the user explicitly asks to run the suggested next command.
- **Success result**: Current state summary, recommended next step, required inputs, expected outputs, and an example invocation.
- **Exit status**: `0` when the guide is produced; `1` when project state cannot be determined well enough to recommend a safe next step.
- **Failure conditions**: Missing repository context or unreadable prerequisite status data.
