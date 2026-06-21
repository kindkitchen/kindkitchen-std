# @kindkitchen/config-loader

The bank of the utils, focused on different ways, use-cases, variants, etc. how
to load configuration of the project.

## `load_dotenvs`

Loads a sequence of dotenv files and merges them into a single config object.

- **Last-win strategy**: files are loaded in order; keys from later files
  override keys from earlier ones.
- **Dynamic paths**: an entry can be a function that receives the config
  accumulated so far and returns the path to the next file. This lets you pick
  the next file based on values already loaded (e.g. an env-specific file chosen
  from a `STAGE` value loaded by a previous file).

The return type `T` is caller-asserted: the merged object is cast to `T` and is
not validated at runtime.

### Usage

```ts
import { load_dotenvs } from "@kindkitchen/config-loader/load_dotenvs";

const config = await load_dotenvs<{ STAGE: string; API_URL: string }>([
  // static path
  ".env",
  // dynamic path: depends on STAGE loaded from ".env"
  (acc) => `.env.${acc.STAGE}`,
]);
```

### Parameters

- `options`: ordered list of dotenv sources. Each entry is either:
  - a `string` — a static path to a dotenv file, or
  - a function `(acc) => string` — returns the next file path based on the
    config accumulated up to that point.

### Returns

The merged config object, cast to `T`.
