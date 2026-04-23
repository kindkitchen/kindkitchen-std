# Copilot instructions for @kindkitchen/std-sweep-line

## Quick commands

- Run full test suite: `deno test ./sweep_line/test_make_sweep_line`
- Run a single test file:
  `deno test ./sweep_line/test_make_sweep_line/overlap-detection.test.ts`
- Run a single test by name: `deno test --filter "substring-of-test-name"`
- Format code: `deno fmt`
- Lint: `deno lint`
- Type-check: `deno check`
- Before committing, run: `deno fmt`, `deno lint`, and `deno check` to ensure
  code is formatted, lint-free, and type-correct.
- Run example demo (from repo root): `deno run ./sweep_line/mod.ts` (example
  guarded by `import.meta.main`)

## High-level architecture

- This package is a small Deno TypeScript library exposing a single core
  factory: `make_sweep_line<T,S,R>(options)`.
- Public entrypoint: `./sweep_line/mod.ts` (re-exports `make_sweep_line`).
  `deno.json` declares the package name and points `.` -> `./mod.ts` for
  consumers.

## Key conventions and repository-specific patterns

- Deno-first project: no third-party package manager; use `deno test`,
  `deno fmt`, `deno lint`.
- Types and generics: API is heavily generic — change public signatures
  carefully and update all tests.
- Tests live under `sweep_line/test_make_sweep_line` and use the Deno test
  runner; pick a test file to run a focused check.
- Example/demo is inline in `sweep_line/mod.ts` under `if (import.meta.main)` —
  good for ad-hoc local verification.

## Guidance for Copilot sessions

- When asked to modify algorithm behavior, search for `make_sweep_line` and
  tests under `sweep_line/test_make_sweep_line` first.
- Preserve the sort invariants (start before end on same x) unless tests are
  updated accordingly.
- If adding a new public option or changing the `processing` contract, update
  `mod.ts`, `deno.json` exports if entrypoint changes, and add or update tests.
- Prefer small, targeted edits and run `deno test` for the corresponding test
  file before proposing larger refactors.

## Existing docs and AI config

- No repository-level README/CONTRIBUTING/AI assistant config files were
  detected; this file serves as the primary Copilot guidance for this package.
