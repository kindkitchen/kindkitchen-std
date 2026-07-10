import type { TomlConfig } from "./toml_config_type.ts";
import * as path from "@std/path";
import { validate_x_input } from "./validate_x_input.ts";
import type { GenerateConstX } from "./generate_const_x_types.ts";
import * as text from "@std/text";
import { insert_content_into_ts_file } from "./util/insert_content_into_ts_file.ts";
import { replace_content_between_markers } from "./util/replace_content_between_markers.ts";
import {
    type CommandContext,
    create_command_context,
} from "./command-context.ts";

const fail = (reason: string, details?: string) => {
    throw new Error(
        `\
x_plopper::ERROR::${process_machine_file.name}
${reason}`,
        { cause: details },
    );
};

/**
 * 1. Check if x-input already exists?
 * if no - create default
 * 2. Validate x-input content
 * 3. Check if states already detailed?
 * if no - create md files
 * 4. Extend x with detailed states
 */
export async function process_machine_file(
    config: TomlConfig,
    options: {
        path_to_machine: string;
        path_to_folder_with_machine: string;
    },
    command_context: CommandContext = create_command_context(),
) {
    const {
        path_to_machine,
        path_to_folder_with_machine,
    } = options;
    const {
        insertion_marker,
        naming,
    } = config;

    /// TODO mv state naming parsing into separate fn
    /// =============================================
    const state_configuration = ([
        "[state.name]",
        "[state.name:snake_case]",
        "[state.name:camelCase]",
        "[state.name:PascalCase]",
        "[state.name:kebab-case]",
    ] as const)
        .find((st) => naming.x.state.includes(st));
    if (!state_configuration) {
        fail("State naming should be contain at least [state.name] segment");
    }

    const state_name_to_state_path = (state_configuration === "[state.name]" ||
            state_configuration === "[state.name:snake_case]")
        ? (name: string) =>
            naming.x.state.replace(state_configuration, text.toSnakeCase(name))
        : state_configuration === "[state.name:camelCase]"
        ? (name: string) =>
            naming.x.state.replace(
                state_configuration,
                text.toCamelCase(name),
            )
        : state_configuration === "[state.name:kebab-case]"
        ? (name: string) =>
            naming.x.state.replace(
                state_configuration,
                text.toKebabCase(name),
            )
        : state_configuration === "[state.name:PascalCase]"
        ? (name: string) =>
            naming.x.state.replace(
                state_configuration,
                text.toPascalCase(name),
            )
        : fail("impossible");

    const path_to_x = path.join(path_to_folder_with_machine, naming.x.x);

    /// 1.
    if (!await command_context.exists(path_to_x)) {
        const default_empty_x_input = {
            action: [],
            actor: [],
            delay: [],
            event: [],
            guard: [],
            state: [],
        } as GenerateConstX.Input;
        await command_context.write_text_file(
            path_to_x,
            JSON.stringify(default_empty_x_input, null, 4),
        );
    }

    /// 2.
    const x_input = JSON.parse(
        await command_context.read_text_file(path_to_x),
    ) as GenerateConstX.Input;

    if (!validate_x_input(x_input)) {
        fail("x input validation failed");
    }
    const output = {
        state: {},
    } as GenerateConstX.Output;
    for (const st of x_input.state) {
        const path_to_md_description = path.join(
            path_to_folder_with_machine,
            state_name_to_state_path(st),
        );

        if (!await command_context.exists(path_to_md_description)) {
            await command_context.write_text_file(
                path_to_md_description,
                `\
## ${st}
> this markdown description can be modified in \`${
                    path_to_md_description.split("/").pop()
                }\` file`,
            );
        }

        output.state[st] = {
            name: st,
            ref: `#${st}`,
            description: await command_context.read_text_file(
                path_to_md_description,
            ),
        };
    }

    output.action = Object.fromEntries(x_input.action.map((k) => [k, k]));
    output.actor = Object.fromEntries(x_input.actor.map((k) => [k, k]));
    output.guard = Object.fromEntries(x_input.guard.map((k) => [k, k]));
    output.delay = Object.fromEntries(x_input.delay.map((k) => [k, k]));

    /// TODO
    output.event = Object.fromEntries(
        x_input.event.map((type) => [type, { type }]),
    );
    const machine_content = await command_context.read_text_file(
        path_to_machine,
    );
    const content_to_insert = `const x = ${
        JSON.stringify(output, null, 4)
    } as const`;
    const new_content = await replace_content_between_markers(
        machine_content,
        {
            marker_start: insertion_marker.x.start,
            marker_end: insertion_marker.x.end,
        },
        content_to_insert,
    ) || await insert_content_into_ts_file(
        machine_content,
        {},
        `\
${insertion_marker.x.start}
${content_to_insert}
${insertion_marker.x.end}
`,
    );

    await command_context.write_text_file(path_to_machine, new_content, {
        create: true,
    });
}
