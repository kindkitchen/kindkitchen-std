---
name: update-effect-4-beta
description: Update Effect dependencies to the latest Effect 4 beta or stable release, adapt affected packages, bump their minor versions, and push the changes.
created: 2026-07-17
updated: 2026-07-17
tags: [dependencies, effect, release]
relates: []
---

Completed the Effect update from 4.0.0-beta.94 to the latest available 4.x
release, 4.0.0-beta.98; no stable Effect 4 exists. Migrated plopper's excluded
example holder from removed `Context.Tag` declarations to `Context.Service`.
Minor-bumped the published Effect users to gauth 0.5.0, internal-util 0.5.0, and
util-xstate 0.3.0. Full tests, lint, targeted formatting/type checks, and
publish dry-runs pass.
