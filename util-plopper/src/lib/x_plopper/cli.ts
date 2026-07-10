import * as path from "@std/path";
import * as fs from "@std/fs";
import { parseArgs } from "@std/cli";
import type { TomlConfig } from "./toml_config_type.ts";
import { process_machine_file } from "./process_machine_file.ts";
import { create_command_context } from "./command-context.ts";

const DEFAULTS = {
    config: ".config/x_plopper.toml",
};

/**
 * Keep in sync with the `version` field in `deno.json`.
 *
 * It is inlined here on purpose: the help command must render without
 * reading any package asset at runtime (see cli.test.ts). A drift guard
 * test asserts this value matches `deno.json`.
 *
 * TODO: switch to a JSON import once import attributes are standardized
 * and stable in Deno:
 *
 *     import deno_json from "../../../deno.json" with { type: "json" };
 */
export const VERSION = "0.5.7";

const HELP_TEXT =
    `                                                                       
            Welcome to x_plopper v{{ version }}!                       

Commands:

    generate         According to config iterate over project populating
                        defined x-generators


Options:

    --help           Read this message.
                     
                     
    --init           Generate default config.
                     
                     
    --interactive    Iterate over options with displayed default values.
                     
                     
    --dry, --dry-run Run command without filesystem modifications.
                     
                     
    --config         Path to config.

                        1. Should have ".toml" extension
                        2. It's default location: "{{ default_config }}"
                        3. Resolved from the current working directory
                            (where x_plopper is executed)
`;

const DEFAULT_CONFIG_TEXT =
    `## Rules how to detect your files with xstate machine.
[naming.machine]

## Scan whole project by some pattern.
## IMPORTANT! Paths are resolved from the current working
## directory (where x_plopper is executed)!
globs = ["**/machine.ts"]
globs_to_exclude = ["**/node_modules/**"]
## Explicitly register concrete machines.
## IMPORTANT! Paths are resolved from the current working
## directory (where x_plopper is executed)!
names = []

## IMPORTANT! All config related will compute paths relatively
## to location of detected machines.
## In other words - each machine may produce some stuff
## defined below.
[naming.x]

## The name of the main minimalistic config
x = "x.json"

## By default each state will produce own file
## transforming it's name to file-name by "snake_case" strategy.
## Another strategies: "kebab-case", "camelCase" and "PascalCase".
## Anyway - [state.name] should be present in configuration
state = "x_state_[state.name:snake_case].md"
event = "x_event.ts"


## Special comment in machine file
## by which will be detected correct
## place, where to generate x
[insertion_marker.x]

start = """\\
/// #x-AUTO-GENERATED-CODEBLOCK-begin
"""

end = """\\
/// #x-AUTO-GENERATED-CODEBLOCK-end
"""
`;

type CliOptions = {
    help: boolean;
    init: boolean;
    generate: boolean;
    config: string;
    dry_run: boolean;
};

const parse_boolean_option = (value: string | null, default_value: boolean) => {
    if (value === null) return default_value;

    const normalized_value = value.trim().toLowerCase();
    if (!normalized_value) return default_value;
    if (["1", "true", "t", "yes", "y"].includes(normalized_value)) {
        return true;
    }
    if (["0", "false", "f", "no", "n"].includes(normalized_value)) {
        return false;
    }

    alert(`Invalid boolean value "${value}". Using default: ${default_value}.`);
    return default_value;
};

const prompt_boolean_option = (name: string, default_value: boolean) => {
    return parse_boolean_option(
        prompt(`${name} [true/false]`, String(default_value)),
        default_value,
    );
};

const format_interactive_summary = (options: CliOptions) =>
    `\
Use these options?
--help: ${options.help}
--init: ${options.init}
generate: ${options.generate}
--dry-run: ${options.dry_run}
--config: ${options.config}`;

const read_interactive_cli_options = (
    default_options: CliOptions,
): CliOptions => {
    alert("x_plopper interactive mode. Press Enter to keep default values.");

    const options = {
        ...default_options,
    };

    options.help = prompt_boolean_option("--help", options.help);
    options.init = prompt_boolean_option("--init", options.init);
    options.generate = prompt_boolean_option("generate", options.generate);
    options.dry_run = prompt_boolean_option("--dry-run", options.dry_run);
    options.config = prompt("--config", options.config)?.trim() ||
        options.config;

    if (!confirm(format_interactive_summary(options))) {
        alert("x_plopper interactive mode cancelled.");
        Deno.exit(1);
    }

    return options;
};

const get_help_text = () =>
    HELP_TEXT
        .replace("{{ version }}", VERSION)
        .replace("{{ default_config }}", DEFAULTS.config);

/**
 * - help
 * - init
 * - generate
 */
export async function cli(cli_arguments: string[]): Promise<void> {
    const input = parseArgs(cli_arguments, {
        "--": true,
        string: ["config"],
        boolean: ["init", "help", "interactive", "dry", "dry-run"],
    });
    const {
        ["--"]: _args_after_dash_dash,
        ["_"]: args,
        interactive,
    } = input;

    let help = Boolean(input.help);
    let config = input.config ?? DEFAULTS.config;
    let init = Boolean(input.init);
    let generate = args.includes("generate");
    let dry_run = Boolean(input.dry || input["dry-run"]);

    if (interactive) {
        ({ help, init, generate, config, dry_run } =
            read_interactive_cli_options({
                help,
                init,
                generate,
                config,
                dry_run,
            }));
    }

    /**
     * Handle `help` command
     */
    if (help || (!generate && !init)) {
        console.log(
            `%c${get_help_text()}`,
            `
background-color: lightyellow;
color: darkblue;
`,
        );

        return;
    }

    const cwd = Deno.cwd();
    const command_context = create_command_context({ dry_run });

    /**
     * Declare path to config
     * (custom with fallback to default)
     */
    const path_to_config = path.join(cwd, config);
    /// No any ambiguous commands
    if (init && generate) {
        console.error(
            "Please choose 1 command - init or generate, but not both!",
        );
        return Deno.exit(1);
    }

    const cp_default_config_to_config_path = async () => {
        const config_folder = path.dirname(path_to_config);
        await command_context.ensure_dir(config_folder);
        await command_context.write_text_file(
            path_to_config,
            DEFAULT_CONFIG_TEXT,
        );
    };

    /**
     * Handle `init` command
     */
    if (init) {
        /// Check is config already exists
        if (await command_context.exists(path_to_config, { isFile: true })) {
            if (command_context.dry_run) {
                command_context.notice(
                    `[dry-run] would overwrite existing config: ${path_to_config}`,
                );
            } else {
                const override = confirm(
                    `The "${path_to_config}" is already exists! Are you sure you want to override it? (y/N)`,
                );

                if (!override) return Deno.exit(1);
            }
        }

        await cp_default_config_to_config_path();
    } /**
     * Command `generate`
     *
     * 0. Init, if not config found
     * 1. Read config
     * 2. Scan project to detect all _machine_ files
     * 3. Process each file
     *     - by name
     *     - by glob (skipping already processed by name)
     */
    else if (generate) {
        const { parse } = await import("@std/toml");

        if (!await command_context.exists(path_to_config)) {
            await cp_default_config_to_config_path();
        }

        /// 1.
        const configStr = await command_context.read_text_file(path_to_config);
        const config = parse(configStr) as TomlConfig;
        console.log(config);

        /// presave names to skip during glob scan
        const machine_paths_from_names = [] as string[];

        /// 3. (by name)
        for (
            /// by the way - technically machine's name is relative path to it
            const machine_name of config.naming.machine.names
        ) {
            const is_exists = await command_context.exists(
                path.join(cwd, machine_name),
            );
            if (!is_exists) {
                console.warn(
                    `The declared in config machine does not exists!\n${machine_name}`,
                );
                continue;
            }
            const path_from_name = path.join(cwd, machine_name);

            machine_paths_from_names.push(path_from_name);

            await process_machine_file(
                config,
                {
                    path_to_machine: path_from_name,
                    path_to_folder_with_machine: path.dirname(path_from_name),
                },
                command_context,
            );
        }

        /// 2. (by glob)
        for (const glob of config.naming.machine.globs) {
            for await (
                const machine of fs.expandGlob(glob, {
                    root: cwd,
                    exclude: config.naming.machine.globs_to_exclude,
                })
            ) {
                if (machine_paths_from_names.includes(machine.path)) {
                    console.warn(
                        `Skip machine, detected by glob, because it is already match by-name locator (${machine.path})`,
                    );
                    continue;
                }

                await process_machine_file(
                    config,
                    {
                        path_to_machine: machine.path,
                        path_to_folder_with_machine: path.dirname(machine.path),
                    },
                    command_context,
                );

                console.log("processing", machine.path);
            }
        }
    }
}

if (import.meta.main) {
    await cli(Deno.args);
}
