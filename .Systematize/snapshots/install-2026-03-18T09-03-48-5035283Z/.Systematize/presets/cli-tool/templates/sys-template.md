<!-- Preset: cli-tool — extends core sys-template with CLI UX patterns -->

## CLI Requirements

### Command Structure

| Command | Subcommands | Description | Example |
|---------|------------|------------|---------|
| [CMD] | [SUB] | [DESC] | `tool cmd sub --flag` |

### CLI UX Patterns

| Pattern | Implementation |
|---------|---------------|
| Help System | `--help` / `-h` on every command |
| Version | `--version` / `-V` |
| Verbosity | `--verbose` / `-v` (stackable) |
| Quiet Mode | `--quiet` / `-q` |
| Output Format | `--format json|table|yaml` |
| Config File | `~/.toolrc` or `--config <path>` |
| Color Output | Auto-detect TTY, `--no-color` |

### Distribution

| Method | Details |
|--------|---------|
| Package Manager | npm / pip / brew / cargo |
| Binary | Platform targets |
| Container | Docker image |

## Changelog

- 2026-03-17: Initial preset template for cli-tool projects
