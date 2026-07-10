# @kindkitchen/plopper — Code Analysis

Review of `src/generate-template/` (cli, load-config, process-template) plus
packaging and the example template under `_place_some-feature_holder_/`.
Findings are ordered by severity with `file:line` references.

---

## Correctness bugs

### B1 — Substring replacement is order-dependent and self-cascading

`process-template.ts:145-151` (no-marker mode)

```ts
let result = source;
for (const [key, value] of Object.entries(dictionary)) {
    result = result.split(key).join(value);
}
```

Two real problems:

1. **No length ordering.** Keys are applied in object-insertion order. A shorter
   key that is a substring of a longer key corrupts the longer one. The example
   dictionary only works by accident of ordering
   (`generate-template.example.toml:25-29`).

2. **Cascading re-replacement.** Each iteration rewrites the _whole evolving
   string_, so if a replacement _value_ contains a later key, it gets replaced
   again. `{ "A": "B", "B": "C" }` turns `"A"` into `"C"`.

**Fix:** do a single pass that replaces all keys simultaneously, longest key
first, and never re-scans substituted regions:

```ts
const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
if (!keys.length) return source;
const pattern = new RegExp(keys.map(escape_regex).join("|"), "g");
return source.replace(pattern, (m) => dictionary[m]);
```

This also makes no-marker mode O(n) instead of O(n·keys).

### B2 — `load_preset` silently returns `undefined` for unknown variants

`_place_some-feature_holder_/mod._place_some-feature_holder_.ts:7-25`

The generated `load_preset` has no `else`/throw; an unmatched variant resolves
to `undefined`, and the inferred return type becomes `… | undefined`. The
downstream `hft` features fixed this by throwing (`throw new Error(\`Unknown
variant: ${variant}\`)`). The shipped template should match.

### B3 — Docs claim "whole words", code replaces substrings

`generate-template.example.toml:10-11` says no-marker mode "replaces dictionary
keys as whole words". The implementation (B1) is a literal substring replace —
intentional per commit `4dc84bf`, but the comment was never updated. Either
update the comment or genuinely honor word boundaries. Pick one; today they
disagree.

### B4 — Shipped template uses the old `Promise.all` preset-loading pattern

`_place_some-feature_holder_/mod._place_some-feature_holder_.ts:9-16`

The template still does the dual dynamic-import via `Promise.all`. The
downstream convention has since moved to a single `preset-<variant>/mod.ts`
barrel that re-exports `Preset`, `Requirements`, `Tag`, loaded with one
`await import("./preset-.../mod.ts")`. The template is the source of truth for
new features and should be upgraded to emit the barrel + single import.

---

## Design / duplication

### D1 — `generate_command` and `init_command` are ~90% duplicated

`cli.ts:93-213` vs `cli.ts:215-374`

Identical `parseArgs` spec, dictionary parsing, `ignore-blobs` splitting,
`cli_override` construction, and the special dictionary-merge block all appear
twice. Extract:

- `parse_common_args(argv)` → returns the normalized fields
- `build_cli_override(fields)` → `Partial<ProcessTemplateOptions>`
- `merge_config(base, override)` → handles the dictionary-augment rule

Both commands then differ only in their I/O step. Cuts the file roughly in half
and removes drift risk between the two paths.

### D2 — Marker-pair validation is implemented three times

`cli.ts:127-135`, `cli.ts:249-256`, `process-template.ts:50-54`

The "start and end must both be present or both absent" rule lives in three
places. Keep the authoritative check in `process_template` (the library
boundary) and have the CLI surface it as a friendly message, rather than
re-deriving it.

### D3 — Dictionary merge runs after the spread, relying on key order

`cli.ts:193-199, 347-353`

`final_options = { ...merged_config, ...cli_override }` first _replaces_ the
dictionary, then a follow-up block re-merges it. It works, but the intent
("augment, don't replace") should live in one `merge_config` helper (see D1) so
it can't be half-applied.

---

## Packaging / distribution

### P1 — Only the CLI is exported; the library is unreachable

`deno.json:6-8`

```json
"exports": { ".": "./src/generate-template/cli.ts" }
```

`process_template`, `transform_string`, `strip_ignored_blocks`,
`load_config_file`, `validate_config`, and `ProcessTemplateOptions` are useful
programmatically but cannot be imported by consumers. Add subpath exports:

```json
"exports": {
  ".": "./src/generate-template/cli.ts",
  "./process-template": "./src/generate-template/process-template.ts",
  "./load-config": "./src/generate-template/load-config.ts"
}
```

### P2 — Two unused dependencies

`deno.json:20-21`

`google-auth-library` is referenced **nowhere** in `src/` (the `.out` matches
are just the example feature _name_ `google-auth-feature`, not the library).
`effect` is used only inside the example template holder, never in `src/`. Both
inflate install time and the dependency graph of every consumer.

- Drop `google-auth-library` entirely.
- Move `effect` out of the package's runtime deps — the template holder is
  scaffolding data, not type-checked package code. If you want the template to
  type-check in CI, isolate it in its own workspace/`deno.json`.

### P3 — No `README.md`, no `SKILL.md`

The repo root has neither. JSR renders the package page from `README.md`; its
absence leaves the listing bare. `SKILL.md` is missing too (see
`LLM-SKILL-GUIDE.md`). Both should exist before the next publish.

### P4 — Help text contradicts the installed invocation

`cli.ts:10-55` documents `deno run -A generate-template.ts …`. Installed from
JSR the entry is `deno run -A jsr:@kindkitchen/plopper …` (or a `deno install`
bin name). Derive the program name from `import.meta` or a constant so help
matches how users actually run it.

---

## Robustness

### R1 — `validate_config` silently drops unknown keys

`load-config.ts:9-85`

A typo'd field (`input-dir` instead of `input_dir`, `dict` instead of
`dictionary`) is silently ignored — the user gets default behavior with no hint
why. Collect unrecognized top-level keys and `console.warn` them.

### R2 — `prompt_yes_no` is `async` but never awaits

`cli.ts:62-74`

`prompt()` is synchronous; the function has no `await`. Drop `async`/`Promise`
(and the `await`s at the call sites) or document why it's async-shaped.

### R3 — `generate` overwrites the output tree with no guard

`process-template.ts:64` ensures the output dir and writes into it
unconditionally. There is no dry-run and no "directory not empty" check, so a
mistargeted `--output` silently clobbers files. Consider `--dry-run` (print the
planned file list) and/or refusing a non-empty `output_dir` without `--force`.

### R4 — Binary detection is read-based, transforms UTF-8-decodable binaries

`process-template.ts:98-103`

Files are treated as text unless `readTextFile` throws. A binary file that
happens to decode as UTF-8 will be run through `transform_string`. Low impact
for code templates, but worth a note or an extension allow/deny list.

---

## Tests

`cli.test.ts` (286), `load-config.test.ts` (178), `process-template.test.ts`
(282) — solid coverage relative to source size. Gaps worth adding once B1/B2 are
fixed:

- ordering/cascade cases for no-marker `transform_string` (regression for B1)
- a same-key-prefix dictionary (`SomeFeature` vs `SomeFeatureInterface`)
- `load_preset` unknown-variant behavior (regression for B2)

---

## Priority

| #     | Item                            | Severity | Effort  | Status                                                                            |
| ----- | ------------------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| B1    | substring ordering/cascade      | high     | low     | ✅ fixed (single-pass, longest-first)                                             |
| B4    | template preset-loading pattern | high     | low     | ⬜ open (old example template untouched)                                          |
| P2    | drop unused deps                | high     | trivial | ✅ dropped `google-auth-library` + `effect`                                       |
| P3    | add README + SKILL.md           | high     | low     | ✅ `README.md` + `skill/SKILL.md`                                                 |
| P1    | export the library              | medium   | trivial | ✅ subpath exports added                                                          |
| D1    | de-duplicate cli commands       | medium   | medium  | ◐ partial — generate/templatize share `load_layered_options`; init still separate |
| B2    | throw on unknown variant        | medium   | trivial | ⬜ open                                                                           |
| B3    | fix "whole words" doc           | low      | trivial | ✅ example.toml comment fixed                                                     |
| D2/D3 | centralize validation/merge     | low      | low     | ◐ marker check + merge centralized in `load_layered_options`                      |
| P4    | help/invocation mismatch        | medium   | trivial | ✅ help uses `jsr:@kindkitchen/plopper`                                           |
| R1–R4 | robustness hardening            | low      | low–med | ⬜ open (`--dry-run`/`--json` still wanted)                                       |

New capabilities added alongside the fixes: a reverse `templatize` command (code
→ template) and an `install-skill` command that boxes the skill into a
user-chosen `--dest`. See `README.md` and `skill/SKILL.md`.
