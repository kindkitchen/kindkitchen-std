# plopper config schema

Every option, where it can be set, and its default. Resolution order is
**built-in defaults → TOML config file → CLI flags** (CLI wins). `--dictionary`
entries are _merged_ into the file's `[dictionary]`, not replaced.

## Fields

| TOML key            | CLI flag               | Type                  | Default | Notes                                                                                |
| ------------------- | ---------------------- | --------------------- | ------- | ------------------------------------------------------------------------------------ |
| `input_dir`         | `--input`              | string (required)     | —       | Source directory. For `generate` it's the template; for `templatize` it's real code. |
| `output_dir`        | `--output`             | string (required)     | —       | Destination directory. Overwritten without confirmation.                             |
| `start_replacement` | `--start-replacement`  | string                | unset   | Opening marker. Must be set with `end_replacement` or not at all.                    |
| `end_replacement`   | `--end-replacement`    | string                | unset   | Closing marker.                                                                      |
| `start_to_ignore`   | `--start-to-ignore`    | string                | unset   | Lines from here to `end_to_ignore` (inclusive) are stripped from copied files.       |
| `end_to_ignore`     | `--end-to-ignore`      | string                | unset   | Closing ignore marker.                                                               |
| `ignore_blobs`      | `--ignore-blobs=<csv>` | string[]              | `[]`    | Path segments skipped while walking (e.g. `node_modules`, `dist`, `.git`).           |
| `[dictionary]`      | `--dictionary k=v`     | record<string,string> | `{}`    | Replacement pairs. Direction depends on the command (see below).                     |

## Init-only flags

| CLI flag           | Type    | Notes                                                                  |
| ------------------ | ------- | ---------------------------------------------------------------------- |
| `--force`          | boolean | Overwrite an existing config without prompting.                        |
| `--reuse-existing` | boolean | With `--force`, load the existing config as base before CLI overrides. |

## Replacement modes

- **Marker mode** — both `start_replacement` and `end_replacement` set.
  `generate` replaces `<start><key><end>` with the dictionary value; unknown
  keys are left untouched.
- **Literal mode** — both markers omitted. Each dictionary key is replaced
  wherever it appears as a substring. Replacement is a single pass, longest key
  first, so a shorter key cannot clobber a longer one and values are never
  re-scanned.

## Dictionary direction by command

- `generate`: `placeholder = "concrete value"` (template → real code).
- `templatize`: `concrete value = "placeholder"` (real code → template). With
  markers, the placeholder is wrapped: `auth` → `<start>some-feature<end>`.

## Exit codes

- `0` success.
- `1` any error (bad args, missing config, IO failure). All current failures use
  `1`; branch on stderr text, not finer codes.
