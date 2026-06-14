btw:

- if this file is at the root of your current run context, also read
  `../AGENTS.md` when it exists; those parent instructions have lower priority
  than this file
- if those parent instructions were already loaded, do not read them again

local context:

- this submodule owns shared utility helpers
- keep helpers small and dependency-light
- avoid importing from feature, api, or web modules
- use `deno check` before finishing util changes
