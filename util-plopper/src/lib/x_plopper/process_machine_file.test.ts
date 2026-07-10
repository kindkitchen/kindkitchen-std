import { expect } from "@std/expect";
import * as path from "@std/path";
import { create_command_context } from "./command-context.ts";
import { process_machine_file } from "./process_machine_file.ts";
import type { TomlConfig } from "./toml_config_type.ts";

const create_test_config = (): TomlConfig => ({
    naming: {
        machine: {
            globs: [],
            globs_to_exclude: [],
            names: [],
        },
        x: {
            x: "x.json",
            state: "x_state_[state.name:snake_case].md",
            event: "x_event.ts",
        },
    },
    insertion_marker: {
        x: {
            start: "/// #x-AUTO-GENERATED-CODEBLOCK-begin\n",
            end: "/// #x-AUTO-GENERATED-CODEBLOCK-end\n",
        },
    },
});

Deno.test(process_machine_file.name, async (t) => {
    await t.step(
        "dry run keeps real files unchanged while exposing virtual output",
        async () => {
            const temp_dir = await Deno.makeTempDir();
            const machine_path = path.join(temp_dir, "machine.ts");
            const x_path = path.join(temp_dir, "x.json");
            const original_machine = "export const machine = {};\n";
            const notices: string[] = [];
            const command_context = create_command_context({
                dry_run: true,
                notice: (message) => notices.push(message),
            });

            try {
                await Deno.writeTextFile(machine_path, original_machine);
                await process_machine_file(
                    create_test_config(),
                    {
                        path_to_machine: machine_path,
                        path_to_folder_with_machine: temp_dir,
                    },
                    command_context,
                );

                expect(await Deno.readTextFile(machine_path)).toBe(
                    original_machine,
                );
                expect(await command_context.exists(x_path, { isFile: true }))
                    .toBe(true);
                expect(await command_context.read_text_file(x_path))
                    .toContain('"state": []');

                const virtual_machine = await command_context.read_text_file(
                    machine_path,
                );
                expect(virtual_machine).toContain(
                    "/// #x-AUTO-GENERATED-CODEBLOCK-begin",
                );
                expect(virtual_machine).toContain("const x = {");
                expect(virtual_machine).toContain("} as const");
                expect(virtual_machine).toContain('"state": {}');
                expect(virtual_machine).toContain(
                    "/// #x-AUTO-GENERATED-CODEBLOCK-end",
                );
                expect(notices.some((notice) => notice.includes(x_path)))
                    .toBe(true);
                expect(notices.some((notice) => notice.includes(machine_path)))
                    .toBe(true);
            } finally {
                await Deno.remove(temp_dir, { recursive: true }).catch(() => {
                });
            }
        },
    );
});
