# Authoring plopper templates

A template is just a directory. Placeholder tokens appear in **file names,
directory names, and file contents**, and are rewritten at generate time.

## The `_place_X_holder_` convention

The bundled starter (`templates/feature/`) uses the marker pair `_place_` …
`_holder_`. A token looks like `_place_some-feature_holder_`, where
`some-feature` is the dictionary key.

Provide each casing variant you need as its own key:

| Key            | Example value | Used for                     |
| -------------- | ------------- | ---------------------------- |
| `some-feature` | `auth`        | kebab-case names, file paths |
| `SomeFeature`  | `Auth`        | PascalCase types/classes     |
| `some-variant` | `default`     | secondary kebab token        |
| `SomeVariant`  | `Default`     | secondary PascalCase token   |

You are free to choose other markers (`{{`/`}}`, `__`/`__`, etc.) — just pass
them via `--start-replacement` / `--end-replacement`. Unique, unambiguous tokens
avoid accidental matches.

## Ignore blocks

Wrap scaffold-only code between the ignore markers; those lines and everything
between them are dropped from generated output:

```ts
/// template ignore start
// notes, sample data, or imports that only make sense inside the template
/// template ignore end
```

Set them with `--start-to-ignore` / `--end-to-ignore` (or the TOML keys).

## Two directions

### Forward: template → code (`generate`)

```bash
deno run -A jsr:@kindkitchen/plopper/templatizer generate \
  --input=templates/feature/_place_some-feature_holder_ \
  --output=src/auth \
  --start-replacement=_place_ --end-replacement=_holder_ \
  --dictionary some-feature=auth --dictionary SomeFeature=Auth
```

### Reverse: code → template (`templatize`)

Point it at real code and map the concrete identifiers to placeholder names.
plopper writes a template with ready-to-replace spots:

```bash
deno run -A jsr:@kindkitchen/plopper/templatizer templatize \
  --input=src/auth \
  --output=templates/feature/_place_some-feature_holder_ \
  --start-replacement=_place_ --end-replacement=_holder_ \
  --dictionary auth=some-feature --dictionary Auth=SomeFeature
```

Round-trip: `templatize` then `generate` with the inverse dictionary returns the
original (modulo any stripped ignore blocks). Provide every casing variant, and
prefer marker mode so substring overlaps can't bleed across keys.
