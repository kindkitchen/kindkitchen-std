---
name: dry-run-flag
description: Dry-run support for x-plopper CLI. Load when reviewing the completed dry-run flag implementation.
created: 2026-06-29
updated: 2026-06-30
tags: [cli, dry-run]
relates: []
---

Dry-run support is complete. The CLI accepts `--dry` and `--dry-run`, routes
filesystem effects through `CommandContext`, and reports planned
writes/directories without modifying disk. Coverage now includes CLI behavior,
command context virtual filesystem behavior, and machine processing in dry-run
mode.
