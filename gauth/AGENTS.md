btw:

- if this file is at the root of your current run context, also read
  `../../AGENTS.md` when it exists; those parent instructions have lower
  priority than this file
- if those parent instructions were already loaded, do not read them again

local context:

- this submodule owns the gAuth feature interface and presets
- keep presets dynamically importable
- do not import from web or api
- local preset may expose mocked HTML through Requirements static methods
- use `deno check` before finishing gAuth changes
