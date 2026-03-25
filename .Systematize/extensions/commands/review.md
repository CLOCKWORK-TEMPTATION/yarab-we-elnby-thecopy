# syskit.review Extension Bridge

This file exists so extension hooks and custom command maps can resolve a stable
path for:

```text
syskit.review
```

The canonical command surface lives at:

```text
commands/syskit.review.md
```

## Contract

- Treat the canonical command file as the single source of truth.
- Do not fork the behavior or the wording here.
- Keep this bridge path valid for extension resolution and hook wiring.
- The runtime entrypoint remains:

```text
setup-review
```
