# @kindkitchen/plopper/templatizer

A bidirectional template generator. Copy a directory and rewrite placeholder
tokens in **file names, directory names, and file contents** — in either
direction:

- **generate** — template → real code (substitute placeholders with values).
- **templatize** — real code → template (replace concrete values with
  ready-to-replace placeholder spots).

Config layers: built-in defaults → TOML file → CLI flags (CLI wins).

## Use directly (CLI)

```bash
# template -> code
deno run -A jsr:@kindkitchen/plopper/templatizer generate \
  --input=<template-dir> --output=<dst-dir> \
  --start-replacement=_place_ --end-replacement=_holder_ \
  --dictionary some-feature=auth --dictionary SomeFeature=Auth

# code -> template (dictionary direction is inverted)
deno run -A jsr:@kindkitchen/plopper/templatizer templatize \
  --input=<real-code-dir> --output=<template-dir> \
  --start-replacement=_place_ --end-replacement=_holder_ \
  --dictionary auth=some-feature --dictionary Auth=SomeFeature

# write a starter TOML config
deno run -A jsr:@kindkitchen/plopper/templatizer init
```

When overwriting an existing config from an agent or script, use `init --force`;
add `--reuse-existing` to load the current file as the base before applying CLI
overrides.

Run `deno run -A jsr:@kindkitchen/plopper/templatizer --help` for the full flag
list.

## Use as an LLM skill

plopper ships a self-contained [Agent Skill](../../skill/SKILL.md) so an agent
(Claude Code, the Agent SDK, etc.) can discover and drive it. Install it into a
project in one command — `--dest` is required so you choose where it lands:

```bash
# project-local (committable, discovered by agents working in the repo)
deno run -A jsr:@kindkitchen/plopper/templatizer install-skill --dest=./.claude/skills/plopper

# or per-machine, for every project
deno run -A jsr:@kindkitchen/plopper/templatizer install-skill --dest=~/.claude/skills/plopper
```

This copies `SKILL.md`, the reference docs, and a ready-to-use starter template
into the destination. Add `--force` to overwrite an existing install.

The typical agent flow it enables: point `templatize` at real codebase fragments
to turn them into a template with common, ready-to-replace spots, then
`generate` new code from that template.

## Use as a library

```ts
import { process_template } from "jsr:@kindkitchen/plopper/templatizer/process-template";
import { load_config_file } from "jsr:@kindkitchen/plopper/templatizer/load-config";
import { install_skill } from "jsr:@kindkitchen/plopper/templatizer/install-skill";
```

## Replacement modes

- **Marker mode** — pass both `--start-replacement` and `--end-replacement`
  (required together). `generate` replaces `<start><key><end>` with the
  dictionary value.
- **Literal mode** — omit both markers. Each dictionary key is replaced wherever
  it appears as a substring (single pass, longest key first, no cascade).

## Docs

- [`skill/SKILL.md`](../../skill/SKILL.md) — the shippable skill.
- [`skill/reference/config-schema.md`](../../skill/reference/config-schema.md) —
  every option, type, default, and exit code.
- [`skill/reference/template-authoring.md`](../../skill/reference/template-authoring.md)
  — the `_place_X_holder_` convention, ignore blocks, and the round-trip.

## License

MIT
