# Systematize Framework Extension Packages

This directory is the bundled catalog of installable extension packages.

## Contract

- Packages stored here are available for installation.
- Packages copied into `.Systematize/extensions/<name>/` are considered installed.
- Optional capabilities are considered active only when their package is installed and their runtime flag is enabled.

## Package Layout

```text
.Systematize/extension-packages/<name>/
  extension.json
  README.md
  commands/
  templates/
```

## Bundled Packages

- `alerts`
- `analytics`
- `export`
- `taskstoissues`
