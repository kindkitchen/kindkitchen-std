---
name: plopper
description: >-
    Use when the user asks to init, initialize, generate, scaffold, create,
    stamp out, or snapshot a feature/component/module/template with plopper.
    Supports generating code from templates and the reverse flow: templatizing or
    extracting real code into a reusable template with ready-to-replace spots.
    Also use for plopper / generate-template / `*.toml` template configs.
compatibility: Requires Deno.
---

# plopper — bidirectional template generator

plopper copies a directory and rewrites placeholder tokens in **file names,
directory names, and file contents**. It runs in two directions:

- **generate** — template → real code (substitute placeholders with values).
- **templatize** — real code → template (replace concrete values with
  ready-to-replace placeholder spots). The inverse of generate.

Config layers: built-in defaults → TOML file → CLI flags (CLI wins).

## When to use

- "scaffold a new feature called X from the template"
- "generate a module from `_place_some-feature_holder_`"
- "make a template out of this existing folder" / "templatize src/auth"
- "extract the common bits so I can stamp out more of these"

## Commands

```bash
# generate (default if no command): template -> code
deno run -A jsr:@kindkitchen/plopper/templatizer generate \
  --input=<template-dir> --output=<dst-dir> \
  [--config-path=<file.toml>] \
  [--start-replacement=<str> --end-replacement=<str>] \
  [--start-to-ignore=<str> --end-to-ignore=<str>] \
  [--ignore-blobs=node_modules,dist,.git] \
  [--dictionary placeholder=value ...]

# templatize: code -> template (dictionary direction is INVERTED)
deno run -A jsr:@kindkitchen/plopper/templatizer templatize \
  --input=<real-code-dir> --output=<template-dir> \
  [--start-replacement=<str> --end-replacement=<str>] \
  --dictionary concrete-value=placeholder ...

# init: write a TOML config (prompts before overwriting unless --force)
deno run -A jsr:@kindkitchen/plopper/templatizer init [--config-path=./generate-template.toml] [flags...] [--force] [--reuse-existing]

# install-skill: copy this skill into a project (--dest is required)
deno run -A jsr:@kindkitchen/plopper/templatizer install-skill --dest=./.claude/skills/plopper [--force]
```

`-h` / `--help` prints full usage.

## Replacement modes

- **Marker mode** — pass both `--start-replacement` and `--end-replacement`
  (required together). `generate` replaces `<start><key><end>` with the
  dictionary value; unknown keys are left untouched.
- **Literal mode** — omit both markers. Each dictionary key is replaced wherever
  it appears as a substring (single pass, longest key first, no cascade).

Prefer marker mode, or unique tokens like `_place_some-feature_holder_`, so one
key cannot overlap another.

## Bundled starter template

After `install-skill`, a ready-to-use template ships at
`templates/feature/_place_some-feature_holder_/`. Generate from it with zero
setup:

```bash
deno run -A jsr:@kindkitchen/plopper/templatizer generate \
  --input=templates/feature/_place_some-feature_holder_ \
  --output=src/auth \
  --start-replacement=_place_ --end-replacement=_holder_ \
  --dictionary some-feature=auth --dictionary SomeFeature=Auth
```

## Reference

- Full option/TOML schema, defaults, exit codes → `reference/config-schema.md`
- Authoring templates, the `_place_X_holder_` convention, ignore blocks, and the
  generate/templatize round-trip → `reference/template-authoring.md`

## Gotchas

- `--start-replacement` and `--end-replacement` must be passed together.
- `generate`/`templatize` overwrite the output tree without confirmation — point
  `--output` at a fresh/disposable dir.
- `init --force` overwrites an existing config without prompting; add
  `--reuse-existing` to merge the current config first.
- `templatize` requires at least one `--dictionary concrete=placeholder` entry,
  and the direction is the opposite of `generate`.
- `install-skill` requires an explicit `--dest`; it refuses to overwrite without
  `--force`.
