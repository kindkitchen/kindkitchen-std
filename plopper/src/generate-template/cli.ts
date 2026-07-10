import { parseArgs } from "@std/cli";
import * as path from "@std/path";
import {
    DEFAULT_PROCESS_TEMPLATE_OPTIONS,
    process_template,
    type ProcessTemplateOptions,
} from "./process-template.ts";
import { load_config_file, stringify_config } from "./load-config.ts";
import {
    install_skill,
    SKILL_ASSET_PATHS,
} from "../install-skill/install-skill.ts";

/**
 * How users invoke the published binary. Used in help text so copy-pasted
 * examples match the real entry point (see ANALYSIS.md P4).
 */
const PROGRAM = "deno run -A jsr:@kindkitchen/plopper/templatizer";
const COMMANDS = ["generate", "templatize", "init", "install-skill"];

const HELP = `\
Usage:
  ${PROGRAM} generate \\
    --input=<src-dir> \\
    --output=<dst-dir> \\
    [--config-path=<path>] \\
    [--start-replacement=<str>] \\
    [--end-replacement=<str>] \\
    [--start-to-ignore=<str>] \\
    [--end-to-ignore=<str>] \\
    [--dictionary key=value ...] \\
    [--ignore-blobs=<csv>]

  ${PROGRAM} templatize \\
    --input=<real-code-dir> \\
    --output=<template-dir> \\
    [--config-path=<path>] \\
    [--start-replacement=<str>] \\
    [--end-replacement=<str>] \\
    [--start-to-ignore=<str>] \\
    [--end-to-ignore=<str>] \\
    --dictionary concrete-value=placeholder ... \\
    [--ignore-blobs=<csv>]

  ${PROGRAM} init \\
    [--config-path=<path>] \\
    [--input=<src-dir>] \\
    [--output=<dst-dir>] \\
    [--start-replacement=<str>] \\
    [--end-replacement=<str>] \\
    [--start-to-ignore=<str>] \\
    [--end-to-ignore=<str>] \\
    [--dictionary key=value ...] \\
    [--ignore-blobs=<csv>] \\
    [--force] \\
    [--reuse-existing]

  ${PROGRAM} install-skill \\
    --dest=<dir> \\
    [--force]

Commands:
  generate       Process template files into output (default if no command specified)
  templatize     Reverse of generate: turn real code into a reusable template
  init           Generate/initialize a TOML config file
  install-skill  Copy the bundled plopper skill into a project so an LLM can use it

Generate Notes:
  * Config layering (lowest to highest priority):
    1. Default built-in configuration
    2. Config file (loaded from --config-path or default locations)
    3. CLI arguments (highest priority, overrides config file)
  * --config-path: path to TOML config file; if provided, file must exist
  * --dictionary may be passed multiple times: --dictionary k1=v1 --dictionary k2=v2
  * --start-replacement / --end-replacement: optional markers around keys; if provided, both are required
    - With markers: replaces "<start><key><end>" with dictionary values
    - Without markers: replaces dictionary keys literally (longest key first)
  * --ignore-blobs is a comma-separated list of path segments to skip (e.g. node_modules,dist)
  * --start-to-ignore / --end-to-ignore: lines between these markers (inclusive) are stripped from copied files

Templatize Notes:
  * Inverse of generate: --dictionary maps a CONCRETE value to a PLACEHOLDER name
    (e.g. --dictionary auth=some-feature --dictionary Auth=SomeFeature).
  * With markers: the placeholder is wrapped, so "auth" becomes "<start>some-feature<end>"
    (e.g. _place_some-feature_holder_). Without markers the bare placeholder is written.
  * Provide every casing variant you use as its own dictionary entry.

Init Notes:
  * If --config-path not provided, config is written to ./generate-template.toml
  * If config file already exists, you will be prompted to confirm and optionally reuse it as base
  * Pass --force to overwrite without prompting; combine with --reuse-existing to use the existing config as base
  * All other CLI arguments override base/default configuration

Install-skill Notes:
  * --dest is required; choose where the skill is written, e.g.
    --dest=./.claude/skills/plopper  (project-local, committable)
    --dest=~/.claude/skills/plopper  (per-machine, all projects)
  * Pass --force to overwrite an existing installation.
`;

/**
 * Prompts user for a yes/no response.
 * Returns true for 'y'/'yes', false for 'n'/'no'.
 * Re-prompts on invalid input.
 */
function prompt_yes_no(message: string): boolean {
    while (true) {
        const response = prompt(message);
        if (response === null) {
            // EOF - treat as 'no'
            return false;
        }
        const lower = response.trim().toLowerCase();
        if (["y", "yes"].includes(lower)) return true;
        if (["n", "no"].includes(lower)) return false;
        console.log('Please enter "y" or "n".');
    }
}

export async function cli(argv: string[]): Promise<void> {
    // If no args or first arg is not a command, default to 'generate'
    let command = "generate";
    let args = argv;

    if (argv.length > 0 && COMMANDS.includes(argv[0])) {
        command = argv[0];
        args = argv.slice(1);
    } else if (argv.length > 0 && !argv[0].startsWith("-")) {
        console.error(
            `Unknown command "${argv[0]}". Expected one of: ${
                COMMANDS.join(", ")
            }.\n`,
        );
        console.error(HELP);
        return Deno.exit(1);
    }

    if (command === "generate") {
        await generate_command(args);
    } else if (command === "templatize") {
        await templatize_command(args);
    } else if (command === "init") {
        await init_command(args);
    } else if (command === "install-skill") {
        await install_skill_command(args);
    }
}

/**
 * Shared argument layering for the generate/templatize commands: built-in
 * defaults → config file → CLI flags (CLI wins, dictionaries augment). Returns
 * a discriminated result so callers can branch on help/error without each
 * re-implementing the merge (see ANALYSIS.md D1/D2/D3).
 */
type LoadResult =
    | { kind: "help" }
    | { kind: "error"; message: string }
    | { kind: "ok"; options: ProcessTemplateOptions };

async function load_layered_options(argv: string[]): Promise<LoadResult> {
    const input = parseArgs(argv, {
        string: [
            "input",
            "output",
            "config-path",
            "start-replacement",
            "end-replacement",
            "start-to-ignore",
            "end-to-ignore",
            "ignore-blobs",
        ],
        boolean: ["help"],
        collect: ["dictionary"],
        alias: { h: "help" },
    });

    if (input.help) return { kind: "help" };

    const {
        input: input_dir,
        output: output_dir,
        "config-path": config_path,
        "start-replacement": start_replacement,
        "end-replacement": end_replacement,
        "start-to-ignore": start_to_ignore,
        "end-to-ignore": end_to_ignore,
        "ignore-blobs": ignore_blobs_raw,
        dictionary: dictionary_raw = [],
    } = input;

    if ((!!start_replacement) !== (!!end_replacement)) {
        return {
            kind: "error",
            message:
                "--start-replacement and --end-replacement must be provided together. Add the missing marker flag or remove both to use literal mode.",
        };
    }

    let dictionary: Record<string, string>;
    try {
        dictionary = parse_dictionary([
            ...(dictionary_raw as string[]),
            ...collect_trailing_dictionary_positional(input._),
        ]);
    } catch (err) {
        return {
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
        };
    }

    const ignore_blobs = ignore_blobs_raw
        ? ignore_blobs_raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    // Layer 1: built-in defaults
    let merged_config: Partial<ProcessTemplateOptions> = {
        ...DEFAULT_PROCESS_TEMPLATE_OPTIONS,
    };

    // Layer 2: config file (if provided)
    if (config_path) {
        try {
            const file_config = await load_config_file(config_path);
            merged_config = { ...merged_config, ...file_config };
        } catch (err) {
            return {
                kind: "error",
                message: `Error loading config file: ${
                    err instanceof Error ? err.message : String(err)
                }. Check --config-path points to a readable TOML file, or omit --config-path and pass --input/--output directly.`,
            };
        }
    }

    // Layer 3: CLI flags (highest priority)
    const cli_override: Partial<ProcessTemplateOptions> = {};
    if (input_dir) cli_override.input_dir = input_dir;
    if (output_dir) cli_override.output_dir = output_dir;
    if (start_replacement !== undefined) {
        cli_override.start_replacement = start_replacement;
    }
    if (end_replacement !== undefined) {
        cli_override.end_replacement = end_replacement;
    }
    if (start_to_ignore !== undefined) {
        cli_override.start_to_ignore = start_to_ignore;
    }
    if (end_to_ignore !== undefined) cli_override.end_to_ignore = end_to_ignore;
    if (dictionary && Object.keys(dictionary).length > 0) {
        cli_override.dictionary = dictionary;
    }
    if (ignore_blobs && ignore_blobs.length > 0) {
        cli_override.ignore_blobs = ignore_blobs;
    }

    const final_options: Partial<ProcessTemplateOptions> = {
        ...merged_config,
        ...cli_override,
    };

    // Dictionaries augment rather than replace.
    if (cli_override.dictionary && merged_config.dictionary) {
        final_options.dictionary = {
            ...merged_config.dictionary,
            ...cli_override.dictionary,
        };
    }

    const missing: string[] = [];
    if (!final_options.input_dir) missing.push("--input or config.input_dir");
    if (!final_options.output_dir) {
        missing.push("--output or config.output_dir");
    }
    if (missing.length) {
        return {
            kind: "error",
            message: `Missing required argument(s): ${
                missing.join(", ")
            }. Provide them as CLI flags or in the TOML config file selected by --config-path.`,
        };
    }

    return { kind: "ok", options: final_options as ProcessTemplateOptions };
}

async function generate_command(argv: string[]): Promise<void> {
    const result = await load_layered_options(argv);
    if (result.kind === "help") {
        console.log(HELP);
        return;
    }
    if (result.kind === "error") {
        console.error(`${result.message}\n`);
        console.error(HELP);
        return Deno.exit(1);
    }

    try {
        await process_template(result.options);
    } catch (err) {
        console.error(
            `generate failed: ${
                err instanceof Error ? err.message : String(err)
            }. Check --input, --output, replacement markers, and dictionary entries.\n`,
        );
        return Deno.exit(1);
    }
}

async function templatize_command(argv: string[]): Promise<void> {
    const result = await load_layered_options(argv);
    if (result.kind === "help") {
        console.log(HELP);
        return;
    }
    if (result.kind === "error") {
        console.error(`${result.message}\n`);
        console.error(HELP);
        return Deno.exit(1);
    }

    const { options } = result;
    if (!options.dictionary || Object.keys(options.dictionary).length === 0) {
        console.error(
            "templatize needs at least one --dictionary concrete=placeholder entry, for example --dictionary auth=some-feature\n",
        );
        console.error(HELP);
        return Deno.exit(1);
    }

    // Invert the workflow: each concrete value is replaced with its placeholder,
    // optionally wrapped in the marker pair. The substitution itself is literal
    // (marker-less), so we hand process_template a derived dictionary and drop
    // the markers from the options.
    const { start_replacement, end_replacement } = options;
    const wrap = (placeholder: string) =>
        start_replacement && end_replacement
            ? `${start_replacement}${placeholder}${end_replacement}`
            : placeholder;

    const template_dictionary: Record<string, string> = {};
    for (const [concrete, placeholder] of Object.entries(options.dictionary)) {
        template_dictionary[concrete] = wrap(placeholder);
    }

    try {
        await process_template({
            ...options,
            start_replacement: undefined,
            end_replacement: undefined,
            dictionary: template_dictionary,
        });
    } catch (err) {
        console.error(
            `templatize failed: ${
                err instanceof Error ? err.message : String(err)
            }. Check --input points to real code, --output is writable, and --dictionary maps concrete values to placeholder names.\n`,
        );
        return Deno.exit(1);
    }
}

async function install_skill_command(argv: string[]): Promise<void> {
    const input = parseArgs(argv, {
        string: ["dest"],
        boolean: ["help", "force"],
        alias: { h: "help" },
    });

    if (input.help) {
        console.log(HELP);
        return;
    }

    const positional_dest = typeof input._[0] === "string" ? input._[0] : "";
    const dest = input.dest;
    if (!dest) {
        if (positional_dest) {
            console.error(
                `install-skill requires --dest=<dir>; positional dest "${positional_dest}" is not supported. Use --dest=${positional_dest}\n`,
            );
            console.error(HELP);
            return Deno.exit(1);
        }
        console.error(
            "install-skill requires an explicit --dest, e.g.\n" +
                "  --dest=./.claude/skills/plopper   (project-local)\n" +
                "  --dest=~/.claude/skills/plopper   (per-machine)\n",
        );
        console.error(HELP);
        return Deno.exit(1);
    }

    try {
        const written = await install_skill({ dest, force: input.force });
        console.log(
            `✓ Installed plopper skill (${written.length}/${SKILL_ASSET_PATHS.length} files) to ${
                path.resolve(dest)
            }`,
        );
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        const hint = detail.includes("Refusing to overwrite")
            ? " Pass --force to overwrite the existing skill installation."
            : " Check --dest points to a writable directory.";
        console.error(
            `Error installing skill: ${detail}.${hint}\n`,
        );
        return Deno.exit(1);
    }
}

async function init_command(argv: string[]): Promise<void> {
    const input = parseArgs(argv, {
        string: [
            "config-path",
            "input",
            "output",
            "start-replacement",
            "end-replacement",
            "start-to-ignore",
            "end-to-ignore",
            "ignore-blobs",
        ],
        boolean: ["help", "force", "reuse-existing"],
        collect: ["dictionary"],
        alias: { h: "help" },
    });

    if (input.help) {
        console.log(HELP);
        return;
    }

    const {
        "config-path": config_path_arg,
        input: input_dir,
        output: output_dir,
        "start-replacement": start_replacement,
        "end-replacement": end_replacement,
        "start-to-ignore": start_to_ignore,
        "end-to-ignore": end_to_ignore,
        "ignore-blobs": ignore_blobs_raw,
        dictionary: dictionary_raw = [],
        force,
        "reuse-existing": reuse_existing,
    } = input;

    const has_start = !!start_replacement;
    const has_end = !!end_replacement;
    if (has_start !== has_end) {
        console.error(
            "--start-replacement and --end-replacement must be provided together. Add the missing marker flag or remove both to use literal mode.\n",
        );
        return Deno.exit(1);
    }

    let dictionary: Record<string, string>;
    try {
        dictionary = parse_dictionary([
            ...(dictionary_raw as string[]),
            ...collect_trailing_dictionary_positional(input._),
        ]);
    } catch (err) {
        console.error(`${err instanceof Error ? err.message : String(err)}\n`);
        return Deno.exit(1);
    }

    const ignore_blobs = ignore_blobs_raw
        ? ignore_blobs_raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    // Determine config path (default: ./generate-template.toml)
    const config_path = config_path_arg || "./generate-template.toml";
    const resolved_path = path.resolve(config_path);

    // Layer 1: Start with built-in defaults
    let merged_config: Partial<ProcessTemplateOptions> = {
        ...DEFAULT_PROCESS_TEMPLATE_OPTIONS,
    };

    // Check if config file exists
    let file_exists = false;
    try {
        await Deno.stat(resolved_path);
        file_exists = true;
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            console.error(
                `Error accessing config path: ${
                    err instanceof Error ? err.message : String(err)
                }. Check --config-path points to a writable file path.\n`,
            );
            return Deno.exit(1);
        }
    }

    // If file exists, ask user for confirmation and optional reuse unless the
    // caller opted into non-interactive overwrite behavior.
    if (file_exists) {
        if (!force) {
            const confirm = prompt_yes_no(
                `Config file already exists at ${resolved_path}. Continue? (y/n): `,
            );
            if (!confirm) {
                console.log("Aborted.");
                return;
            }
        }

        const should_reuse = force
            ? Boolean(reuse_existing)
            : prompt_yes_no(`Use existing config as base? (y/n): `);
        if (should_reuse) {
            try {
                const file_config = await load_config_file(config_path);
                merged_config = { ...merged_config, ...file_config };
            } catch (err) {
                console.error(
                    `Error loading existing config: ${
                        err instanceof Error ? err.message : String(err)
                    }. Answer "n" to "Use existing config as base?" or fix the existing TOML file.\n`,
                );
                return Deno.exit(1);
            }
        }
    }

    // Layer 2: Override with CLI arguments (highest priority)
    const cli_override: Partial<ProcessTemplateOptions> = {};
    if (input_dir) cli_override.input_dir = input_dir;
    if (output_dir) cli_override.output_dir = output_dir;
    if (start_replacement !== undefined) {
        cli_override.start_replacement = start_replacement;
    }
    if (end_replacement !== undefined) {
        cli_override.end_replacement = end_replacement;
    }
    if (start_to_ignore !== undefined) {
        cli_override.start_to_ignore = start_to_ignore;
    }
    if (end_to_ignore !== undefined) cli_override.end_to_ignore = end_to_ignore;
    if (dictionary && Object.keys(dictionary).length > 0) {
        cli_override.dictionary = dictionary;
    }
    if (ignore_blobs && ignore_blobs.length > 0) {
        cli_override.ignore_blobs = ignore_blobs;
    }

    // Final merged configuration for init command
    const final_config: Partial<ProcessTemplateOptions> = {
        ...merged_config,
        ...cli_override,
    };

    // Merge dictionaries specially (don't replace, augment)
    if (cli_override.dictionary && merged_config.dictionary) {
        final_config.dictionary = {
            ...merged_config.dictionary,
            ...cli_override.dictionary,
        };
    }

    // Convert to TOML and write (include_examples=true to show all options)
    const toml_content = stringify_config(final_config, true);

    try {
        // Ensure directory exists
        const dir = path.dirname(resolved_path);
        await Deno.mkdir(dir, { recursive: true });

        // Write config file
        await Deno.writeTextFile(resolved_path, toml_content);
        console.log(`✓ Config written to ${resolved_path}`);
    } catch (err) {
        console.error(
            `Error writing config: ${
                err instanceof Error ? err.message : String(err)
            }. Check the parent directory permissions for --config-path.\n`,
        );
        return Deno.exit(1);
    }
}

function parse_dictionary(entries: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const entry of entries) {
        const idx = entry.indexOf("=");
        if (idx <= 0) {
            throw new Error(
                `Invalid --dictionary entry: "${entry}" (expected key=value, for example --dictionary some-feature=auth)`,
            );
        }
        const key = entry.slice(0, idx);
        const value = entry.slice(idx + 1);
        result[key] = value;
    }
    return result;
}

/**
 * Support the user-facing form `--dictionary k1=v1 k2=v2`, where everything
 * after the first dictionary value lands in positional args.
 */
function collect_trailing_dictionary_positional(
    positional: (string | number)[],
): string[] {
    return positional
        .map(String)
        .filter((p) => /^[^=\s]+=.+/.test(p));
}

if (import.meta.main) {
    await cli(Deno.args);
}
