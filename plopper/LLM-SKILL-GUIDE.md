# Making plopper LLM-aware (exporting a Skill)

Today the project ships a CLI and nothing that tells an LLM agent it exists or
how to drive it. This guide covers what to add so Claude Code / the Agent SDK
(and similar agents) can discover and use plopper, from the minimum (`SKILL.md`)
to a fuller integration.

---

## Level 0 — what an "Agent Skill" is

A Skill is a folder with a `SKILL.md` at its root. `SKILL.md` has YAML
frontmatter (`name`, `description`) followed by Markdown instructions. The agent
reads only the frontmatter up front; it loads the body **on demand** when the
`description` matches the task. That progressive-disclosure model is why the
`description` must say _when to use it_, not just what it is.

The canonical `SKILL.md` lives at `./skill/SKILL.md` (copied into a project by
`install-skill`). That alone makes plopper usable as a personal/project skill.

---

## Level 1 — ship `SKILL.md` so it's discoverable

Three placement options, cheapest first:

1. **Project skill (this repo).** Keep `SKILL.md` at the repo root (done). Any
   agent working inside this repo can read it. Good for contributors to plopper
   itself.

2. **Installed skill (per machine).** A consumer copies the skill into their
   agent's skills directory, e.g. `~/.claude/skills/plopper/SKILL.md`. To make
   that one step, add a task:

   ```jsonc
   // deno.json
   "tasks": {
     "install:skill": "deno run -A jsr:@kindkitchen/plopper install-skill"
   }
   ```

   …backed by a tiny `install-skill` command that copies `SKILL.md` (and any
   referenced files) into the target skills dir. This is the highest-leverage
   addition: `deno run -A jsr:@kindkitchen/plopper install-skill` and the agent
   now knows the tool.

3. **Bundled with the package.** Add `SKILL.md` to the published files so it
   travels with the package on JSR, and document the install task in the README.
   Consumers then run one command to register it.

### Frontmatter rules that matter

- `name`: lowercase, hyphenated, stable (it's the invocation handle).
- `description`: the single most important line. Front-load trigger phrases the
  user is likely to say ("scaffold a feature", "generate from template", "stamp
  out a module") plus concrete signals ("`*.toml` template config",
  "`generate-template`"). The current draft does this — keep it tuned as you
  learn how people ask.
- Keep the body skimmable: commands, flags, one or two copy-paste examples,
  gotchas. Avoid prose the agent has to parse to extract a command.

---

## Level 2 — make the CLI itself agent-friendly

Skills work best when the tool behind them is predictable. Cheap wins:

- **Stable, documented exit codes.** Today failures all `Deno.exit(1)`. Give
  distinct codes (bad args, missing config, IO error) and list them in
  `SKILL.md`. Agents branch on exit codes.
- **`--json` output.** A machine-readable summary of what was generated (files
  written, tokens replaced, skipped paths) lets an agent verify the result
  without scraping human log lines.
- **`--dry-run`.** Lets the agent preview the file plan and show the user before
  touching disk. Doubles as the safety guard called out in `ANALYSIS.md` (R3).
- **Self-describing help.** Derive the program name in help text from
  `import.meta` (see `ANALYSIS.md` P4) so the examples an agent copies actually
  run under `jsr:@kindkitchen/plopper`.

None of these require new dependencies.

---

## Level 3 — bundle reusable assets with the skill

A Skill folder can contain more than `SKILL.md`; reference extra files from the
body and the agent loads them only when needed (progressive disclosure):

```
plopper-skill/
  SKILL.md                      # frontmatter + instructions
  reference/
    config-schema.md            # every TOML field, types, defaults
    template-authoring.md       # _place_X_holder_ convention, casing variants,
                                #   /// template ignore start|end
  templates/
    effect-feature/             # ready-to-use starter template
```

Why this helps:

- The `_place_X_holder_` naming + casing-variant convention and the ignore-block
  markers are currently undocumented anywhere. Captured as a `reference/` doc,
  an agent can _author new templates_, not just run existing ones.
- Shipping a vetted starter template (`templates/effect-feature/`) means an
  agent can scaffold with zero setup: point `--input` at the bundled template.

Keep `SKILL.md` lean and link out to these files ("For the full TOML schema see
`reference/config-schema.md`") rather than inlining everything.

---

## Level 4 — optional: a slash command / wrapper

For Claude Code specifically, a thin slash command (e.g. `/scaffold-feature`)
that shells out to `plopper generate` with sensible defaults gives users a
one-liner and gives the agent an unambiguous entry point. This is sugar on top
of the Skill, not a replacement for it.

---

## Recommended order of work

1. Ship a canonical `SKILL.md`. _(done — `skill/SKILL.md`)_
2. Add an `install-skill` command + `deno task install:skill`. _(done — requires
   an explicit `--dest`)_
3. Extract `reference/config-schema.md` and `reference/template-authoring.md`.
   _(done — under `skill/reference/`)_
4. Bundle a starter template. _(done — `skill/templates/feature/`)_
5. Add the reverse `templatize` command (code → template). _(done)_
6. Still open: `--dry-run` / `--json` output and finer exit codes; an optional
   slash-command wrapper for Claude Code.

Current layout shipped with the package:

```
skill/
  SKILL.md
  reference/
    config-schema.md
    template-authoring.md
  templates/
    feature/_place_some-feature_holder_/
```

`install-skill` copies this whole tree into a user-chosen `--dest` (e.g.
`./.claude/skills/plopper`).

---

## Cross-references

- `skill/SKILL.md` — the shippable skill file.
- `README.md` — direct/CLI, skill, and library usage.
- `ANALYSIS.md` — P3 (docs) and P4 (help/invocation) are resolved; `--dry-run`
  (R3) / `--json` remain open.
