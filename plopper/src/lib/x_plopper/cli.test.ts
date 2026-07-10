import { cli, VERSION } from "./cli.ts";
import { join } from "@std/path";
import * as fs from "@std/fs";
import { expect } from "@std/expect";

const cwd = Deno.cwd();

const mock_interactive_functions = (options: {
    prompt_answers: (string | null)[];
    confirm_answers: boolean[];
}) => {
    const original_prompt = globalThis.prompt;
    const original_confirm = globalThis.confirm;
    const original_alert = globalThis.alert;

    const prompt_calls: { message: string; default_value?: string }[] = [];
    const confirm_calls: string[] = [];
    const alert_calls: string[] = [];
    const prompt_answers = [...options.prompt_answers];
    const confirm_answers = [...options.confirm_answers];

    globalThis.prompt = (message = "", default_value?: string) => {
        prompt_calls.push({ message, default_value });
        const answer = prompt_answers.shift();
        return answer === undefined ? default_value ?? null : answer;
    };
    globalThis.confirm = (message = "") => {
        confirm_calls.push(message);
        const answer = confirm_answers.shift();
        return answer === undefined ? false : answer;
    };
    globalThis.alert = (message = "") => {
        alert_calls.push(message);
    };

    return {
        prompt_calls,
        confirm_calls,
        alert_calls,
        restore: () => {
            globalThis.prompt = original_prompt;
            globalThis.confirm = original_confirm;
            globalThis.alert = original_alert;
        },
    };
};

Deno.test(cli.name, async (t) => {
    await t.step(
        "The inlined VERSION should match deno.json",
        async () => {
            const deno_json = JSON.parse(
                await Deno.readTextFile(
                    join(import.meta.dirname!, "../../../deno.json"),
                ),
            ) as { version: string };

            expect(VERSION).toBe(deno_json.version);
        },
    );

    await t.step(
        "The help command should not read package assets at runtime",
        async () => {
            const original_read_text_file = Deno.readTextFile;
            const original_console_log = console.log;
            const console_calls: unknown[][] = [];

            Deno.readTextFile = (() => {
                throw new Error("Deno.readTextFile should not be called");
            }) as typeof Deno.readTextFile;
            console.log = (...data: unknown[]) => {
                console_calls.push(data);
            };

            try {
                await cli(["--help"]);

                expect(console_calls.length).toBe(1);
                expect(
                    String(console_calls[0][0]).includes(
                        `Welcome to x_plopper v${VERSION}`,
                    ),
                )
                    .toBe(true);
                expect(
                    String(console_calls[0][0]).includes(
                        ".config/x_plopper.toml",
                    ),
                ).toBe(true);
                expect(
                    String(console_calls[0][0]).includes("--dry, --dry-run"),
                ).toBe(true);
            } finally {
                Deno.readTextFile = original_read_text_file;
                console.log = original_console_log;
            }
        },
    );

    await t.step(
        "The init command should not copy package assets at runtime",
        async () => {
            const config_path = join(
                import.meta.dirname!,
                "fixture/test.embedded.config.toml",
            );
            const relative_config_path = config_path.replace(
                new RegExp(`^${cwd}`),
                "",
            );
            const original_copy_file = Deno.copyFile;

            Deno.copyFile = (() => {
                throw new Error("Deno.copyFile should not be called");
            }) as typeof Deno.copyFile;

            try {
                await Deno.remove(config_path).catch(() => {});
                await cli(["--init", `--config=${relative_config_path}`]);

                expect(await fs.exists(config_path)).toBe(true);
                expect(await Deno.readTextFile(config_path)).toBe(
                    await Deno.readTextFile(
                        join(import.meta.dirname!, "default_config.toml"),
                    ),
                );
            } finally {
                Deno.copyFile = original_copy_file;
                await Deno.remove(config_path).catch(() => {});
            }
        },
    );

    await t.step(
        "The dry init command should report writes without modifying filesystem",
        async () => {
            const config_path = join(
                import.meta.dirname!,
                "fixture/test.dry.config.toml",
            );
            const relative_config_path = config_path.replace(
                new RegExp(`^${cwd}`),
                "",
            );
            const original_write_text_file = Deno.writeTextFile;
            const original_console_log = console.log;
            const console_calls: unknown[][] = [];

            Deno.writeTextFile = (() => {
                throw new Error("Deno.writeTextFile should not be called");
            }) as typeof Deno.writeTextFile;
            console.log = (...data: unknown[]) => {
                console_calls.push(data);
            };

            try {
                await Deno.remove(config_path).catch(() => {});
                await cli([
                    "--dry",
                    "--init",
                    `--config=${relative_config_path}`,
                ]);

                expect(await fs.exists(config_path)).toBe(false);
                expect(
                    console_calls.some((call) =>
                        String(call[0]).includes(
                            "[dry-run] would ensure directory:",
                        )
                    ),
                ).toBe(true);
                expect(
                    console_calls.some((call) =>
                        String(call[0]).includes("[dry-run] would write file:")
                    ),
                ).toBe(true);
            } finally {
                Deno.writeTextFile = original_write_text_file;
                console.log = original_console_log;
                await Deno.remove(config_path).catch(() => {});
            }
        },
    );

    await t.step(
        "The dry generate command should report writes without modifying filesystem",
        async () => {
            const config_path = join(
                import.meta.dirname!,
                "fixture/test.dry.generate.config.toml",
            );
            const machine_path = join(
                import.meta.dirname!,
                "fixture/machine.ts",
            );
            const relative_config_path = config_path.replace(
                new RegExp(`^${cwd}`),
                "",
            );
            const original_machine = await Deno.readTextFile(machine_path);
            const original_write_text_file = Deno.writeTextFile;
            const original_console_log = console.log;
            const console_calls: unknown[][] = [];

            Deno.writeTextFile = (() => {
                throw new Error("Deno.writeTextFile should not be called");
            }) as typeof Deno.writeTextFile;
            console.log = (...data: unknown[]) => {
                console_calls.push(data);
            };

            try {
                await Deno.remove(config_path).catch(() => {});
                await cli([
                    "generate",
                    "--dry-run",
                    `--config=${relative_config_path}`,
                ]);

                expect(await fs.exists(config_path)).toBe(false);
                expect(await Deno.readTextFile(machine_path)).toBe(
                    original_machine,
                );
                expect(
                    console_calls.some((call) =>
                        String(call[0]).includes("[dry-run] would write file:")
                    ),
                ).toBe(true);
            } finally {
                Deno.writeTextFile = original_write_text_file;
                console.log = original_console_log;
                await Deno.writeTextFile(machine_path, original_machine);
                await Deno.remove(config_path).catch(() => {});
            }
        },
    );

    await t.step("The generate command should work", async () => {
        const config_path = join(
            import.meta.dirname!,
            "fixture/test.config.toml",
        );
        const machine_path = join(import.meta.dirname!, "fixture/machine.ts");
        const original_machine = await Deno.readTextFile(machine_path);
        /**
         * Simulate relative path from the root of this folder,
         * not the real cwd for this test.
         */
        const relative_config_path = config_path.replace(
            new RegExp(`^${cwd}`),
            "",
        );

        try {
            await Deno.remove(config_path).catch(() => {});
            await cli([
                "generate",
                `--config=${relative_config_path}`,
            ]);
            const is_config_exists = await fs.exists(config_path);
            const generated_machine = await Deno.readTextFile(machine_path);

            expect(is_config_exists).toBe(true);
            expect(generated_machine).toContain(
                "/// #x-AUTO-GENERATED-CODEBLOCK-begin",
            );
            expect(generated_machine).toContain("const x = {");
            expect(generated_machine).toContain("} as const");
            expect(generated_machine).toContain('"Init": {');
            expect(generated_machine).toContain('"on done": {');
            expect(generated_machine).toContain(
                "/// #x-AUTO-GENERATED-CODEBLOCK-end",
            );
        } finally {
            await Deno.writeTextFile(machine_path, original_machine);
            await Deno.remove(config_path).catch(() => {});
        }
    });

    await t.step(
        "The interactive init command should prompt options with defaults",
        async () => {
            const config_path = join(
                import.meta.dirname!,
                "fixture/test.interactive.config.toml",
            );
            const relative_config_path = config_path.replace(
                new RegExp(`^${cwd}`),
                "",
            );
            await Deno.remove(config_path).catch(() => {});

            const interactive_functions = mock_interactive_functions({
                prompt_answers: ["", "true", "", "", relative_config_path],
                confirm_answers: [true],
            });

            try {
                await cli(["--interactive"]);

                expect(interactive_functions.alert_calls).toEqual([
                    "x_plopper interactive mode. Press Enter to keep default values.",
                ]);
                expect(interactive_functions.prompt_calls).toEqual([
                    {
                        message: "--help [true/false]",
                        default_value: "false",
                    },
                    {
                        message: "--init [true/false]",
                        default_value: "false",
                    },
                    {
                        message: "generate [true/false]",
                        default_value: "false",
                    },
                    {
                        message: "--dry-run [true/false]",
                        default_value: "false",
                    },
                    {
                        message: "--config",
                        default_value: ".config/x_plopper.toml",
                    },
                ]);
                expect(interactive_functions.confirm_calls).toEqual([
                    `Use these options?\n--help: false\n--init: true\ngenerate: false\n--dry-run: false\n--config: ${relative_config_path}`,
                ]);
                expect(await fs.exists(config_path)).toBe(true);
            } finally {
                interactive_functions.restore();
                await Deno.remove(config_path).catch(() => {});
            }
        },
    );
});
