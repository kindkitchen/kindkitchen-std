---
name: help-usage-devx
description: DevX improvements for help/usage output. Load when working on the CLI help text, usage docs, or onboarding messaging.
created: 2026-06-30
updated: 2026-07-09
tags: [cli, devx, docs]
relates: []
---

Done. The misleading "relative to project's root" wording was fixed across all
four surfaces (`HELP_TEXT`, `DEFAULT_CONFIG_TEXT`, `help.txt`,
`default_config.toml`); verified behavior is cwd-relative resolution. Generated
`const x` now carries an `as const` suffix (same change set).

Leftover triage ideas (`--version` flag, per-command examples, README/help
alignment) were not implemented — see [[002.log]]; open a new task if needed.
