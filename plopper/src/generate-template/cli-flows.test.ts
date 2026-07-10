import { expect } from "@std/expect";
import * as path from "@std/path";
import { parse as parse_toml } from "@std/toml";
import { cli } from "./cli.ts";
import { SKILL_ASSET_PATHS } from "../install-skill/install-skill.ts";

const CLI_ENTRY = path.resolve(
    import.meta.dirname!,
    "../../generate-template.ts",
);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

interface CliResult {
    code: number;
    stdout: string;
    stderr: string;
}

async function run_cli(
    args: string[],
    options: { cwd?: string; stdin?: string } = {},
): Promise<CliResult> {
    const command = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", CLI_ENTRY, ...args],
        cwd: options.cwd,
        stdin: options.stdin === undefined ? "null" : "piped",
        stdout: "piped",
        stderr: "piped",
    });

    const output = options.stdin === undefined
        ? await command.output()
        : await (async () => {
            const child = command.spawn();
            const writer = child.stdin.getWriter();
            await writer.write(encoder.encode(options.stdin));
            await writer.close();
            return await child.output();
        })();

    return {
        code: output.code,
        stdout: decoder.decode(output.stdout),
        stderr: decoder.decode(output.stderr),
    };
}

async function with_temp_dir(
    prefix: string,
    fn: (dir: string) => Promise<void>,
): Promise<void> {
    const dir = await Deno.makeTempDir({ prefix });
    try {
        await fn(dir);
    } finally {
        await Deno.remove(dir, { recursive: true });
    }
}

async function with_mock_prompt(
    answers: string[],
    fn: () => Promise<void>,
): Promise<void> {
    const original_prompt = globalThis.prompt;
    const original_log = console.log;
    const queue = [...answers];
    globalThis.prompt = () => queue.shift() ?? null;
    console.log = () => {};
    try {
        await fn();
    } finally {
        globalThis.prompt = original_prompt;
        console.log = original_log;
    }
}

Deno.test("CLI help and command dispatch", async (t) => {
    for (
        const args of [
            ["--help"],
            ["-h"],
            ["generate", "--help"],
            ["templatize", "--help"],
            ["init", "--help"],
            ["install-skill", "--help"],
        ]
    ) {
        await t.step(args.join(" "), async () => {
            const result = await run_cli(args);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("Usage:");
            expect(result.stdout).toContain("install-skill");
            expect(result.stderr).toBe("");
        });
    }

    await t.step("explicit generate matches default command", async () => {
        await with_temp_dir("plopper-dispatch-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const out_default = path.join(tmp, "out-default");
            const out_explicit = path.join(tmp, "out-explicit");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(
                path.join(input_dir, "name.txt"),
                "Hello NAME",
            );

            const default_result = await run_cli([
                `--input=${input_dir}`,
                `--output=${out_default}`,
                "--dictionary=NAME=World",
            ]);
            const explicit_result = await run_cli([
                "generate",
                `--input=${input_dir}`,
                `--output=${out_explicit}`,
                "--dictionary=NAME=World",
            ]);

            expect(default_result.code).toBe(0);
            expect(explicit_result.code).toBe(0);
            expect(await Deno.readTextFile(path.join(out_default, "name.txt")))
                .toBe(
                    "Hello World",
                );
            expect(await Deno.readTextFile(path.join(out_explicit, "name.txt")))
                .toBe(
                    "Hello World",
                );
        });
    });

    await t.step("unknown command exits with actionable error", async () => {
        const result = await run_cli(["unknown-command"]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('Unknown command "unknown-command"');
        expect(result.stderr).toContain(
            "generate, templatize, init, install-skill",
        );
    });
});

Deno.test("install-skill CLI flows", async (t) => {
    await t.step("writes every bundled asset", async () => {
        await with_temp_dir("plopper-skill-", async (tmp) => {
            const dest = path.join(tmp, "skills", "plopper");
            const result = await run_cli(["install-skill", `--dest=${dest}`]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain("Installed plopper skill");
            for (const rel of SKILL_ASSET_PATHS) {
                const stat = await Deno.stat(path.join(dest, rel)).catch(() =>
                    null
                );
                expect(stat?.isFile).toBe(true);
            }
        });
    });

    await t.step(
        "refuses overwrite without force and succeeds with force",
        async () => {
            await with_temp_dir("plopper-skill-force-", async (tmp) => {
                const dest = path.join(tmp, "skills", "plopper");
                expect(
                    (await run_cli(["install-skill", `--dest=${dest}`])).code,
                ).toBe(
                    0,
                );

                const refused = await run_cli([
                    "install-skill",
                    `--dest=${dest}`,
                ]);
                expect(refused.code).toBe(1);
                expect(refused.stderr).toContain("Refusing to overwrite");
                expect(refused.stderr).toContain("--force");

                const forced = await run_cli([
                    "install-skill",
                    `--dest=${dest}`,
                    "--force",
                ]);
                expect(forced.code).toBe(0);
            });
        },
    );

    await t.step("requires dest", async () => {
        const result = await run_cli(["install-skill"]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("install-skill requires");
        expect(result.stderr).toContain("--dest");
    });

    await t.step("rejects positional dest with --dest guidance", async () => {
        const result = await run_cli(["install-skill", "./somewhere"]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("positional dest");
        expect(result.stderr).toContain("--dest=./somewhere");
    });
});

Deno.test("templatize CLI validation and config flows", async (t) => {
    await t.step("requires dictionary", async () => {
        await with_temp_dir("plopper-templatize-required-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(path.join(input_dir, "auth.ts"), "auth");

            const result = await run_cli([
                "templatize",
                `--input=${input_dir}`,
                `--output=${output_dir}`,
            ]);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain("at least one --dictionary");
            expect(result.stderr).toContain("auth=some-feature");
        });
    });

    await t.step("rejects mismatched markers", async () => {
        const result = await run_cli([
            "templatize",
            "--input=.",
            "--output=out",
            "--start-replacement=_place_",
            "--dictionary=auth=some-feature",
        ]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain(
            "--start-replacement and --end-replacement",
        );
        expect(result.stderr).toContain("literal mode");
    });

    await t.step("rejects invalid dictionary entry", async () => {
        const result = await run_cli([
            "templatize",
            "--input=.",
            "--output=out",
            "--dictionary=invalid",
        ]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("Invalid --dictionary entry");
        expect(result.stderr).toContain("key=value");
    });

    await t.step(
        "uses config for input output markers and dictionary",
        async () => {
            await with_temp_dir("plopper-templatize-config-", async (tmp) => {
                const input_dir = path.join(tmp, "input");
                const output_dir = path.join(tmp, "output");
                const config_file = path.join(tmp, "config.toml");
                await Deno.mkdir(input_dir);
                await Deno.writeTextFile(
                    path.join(input_dir, "auth.ts"),
                    "export const Auth = 'auth';",
                );
                await Deno.writeTextFile(
                    config_file,
                    [
                        `input_dir = "${input_dir}"`,
                        `output_dir = "${output_dir}"`,
                        'start_replacement = "_place_"',
                        'end_replacement = "_holder_"',
                        "[dictionary]",
                        'auth = "some-feature"',
                        'Auth = "SomeFeature"',
                    ].join("\n"),
                );

                const result = await run_cli([
                    "templatize",
                    `--config-path=${config_file}`,
                ]);
                expect(result.code).toBe(0);
                const out = await Deno.readTextFile(
                    path.join(output_dir, "_place_some-feature_holder_.ts"),
                );
                expect(out).toBe(
                    "export const _place_SomeFeature_holder_ = '_place_some-feature_holder_';",
                );
            });
        },
    );

    await t.step("merges config dictionary with CLI dictionary", async () => {
        await with_temp_dir("plopper-templatize-merge-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            const config_file = path.join(tmp, "config.toml");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(
                path.join(input_dir, "auth.ts"),
                "Auth auth",
            );
            await Deno.writeTextFile(
                config_file,
                [
                    'start_replacement = "_place_"',
                    'end_replacement = "_holder_"',
                    "[dictionary]",
                    'auth = "some-feature"',
                ].join("\n"),
            );

            const result = await run_cli([
                "templatize",
                `--input=${input_dir}`,
                `--output=${output_dir}`,
                `--config-path=${config_file}`,
                "--dictionary=Auth=SomeFeature",
            ]);
            expect(result.code).toBe(0);
            const out = await Deno.readTextFile(
                path.join(output_dir, "_place_some-feature_holder_.ts"),
            );
            expect(out).toBe(
                "_place_SomeFeature_holder_ _place_some-feature_holder_",
            );
        });
    });

    await t.step("honors ignore blobs while templatizing", async () => {
        await with_temp_dir("plopper-templatize-ignore-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            await Deno.mkdir(path.join(input_dir, "src"), { recursive: true });
            await Deno.mkdir(path.join(input_dir, "dist"), { recursive: true });
            await Deno.writeTextFile(
                path.join(input_dir, "src", "auth.ts"),
                "auth",
            );
            await Deno.writeTextFile(
                path.join(input_dir, "dist", "auth.ts"),
                "auth",
            );

            const result = await run_cli([
                "templatize",
                `--input=${input_dir}`,
                `--output=${output_dir}`,
                "--dictionary=auth=some-feature",
                "--ignore-blobs=dist",
            ]);
            expect(result.code).toBe(0);
            expect(
                await Deno.stat(path.join(output_dir, "src")).then(() => true),
            )
                .toBe(true);
            expect(
                await Deno.stat(path.join(output_dir, "dist")).catch(() =>
                    null
                ),
            )
                .toBe(null);
        });
    });
});

Deno.test("init CLI flows", async (t) => {
    await t.step("writes default config in cwd", async () => {
        await with_temp_dir("plopper-init-default-", async (tmp) => {
            const result = await run_cli(["init"], { cwd: tmp });
            expect(result.code).toBe(0);
            const config_path = path.join(tmp, "generate-template.toml");
            const stat = await Deno.stat(config_path).catch(() => null);
            expect(stat?.isFile).toBe(true);
            const content = await Deno.readTextFile(config_path);
            expect(content).toContain("[dictionary]");
        });
    });

    await t.step(
        "creates parent directories and serializes flags",
        async () => {
            await with_temp_dir("plopper-init-flags-", async (tmp) => {
                const config_file = path.join(tmp, "nested", "config.toml");
                const result = await run_cli([
                    "init",
                    `--config-path=${config_file}`,
                    "--input=template",
                    "--output=output",
                    "--start-replacement=_place_",
                    "--end-replacement=_holder_",
                    "--start-to-ignore=START",
                    "--end-to-ignore=END",
                    "--ignore-blobs=node_modules, dist,, .git",
                    "--dictionary=SomeFeature=Auth",
                ]);

                expect(result.code).toBe(0);
                const parsed = parse_toml(
                    await Deno.readTextFile(config_file),
                ) as Record<
                    string,
                    unknown
                >;
                expect(parsed.input_dir).toBe("template");
                expect(parsed.output_dir).toBe("output");
                expect(parsed.start_replacement).toBe("_place_");
                expect(parsed.end_replacement).toBe("_holder_");
                expect(parsed.start_to_ignore).toBe("START");
                expect(parsed.end_to_ignore).toBe("END");
                expect(parsed.ignore_blobs).toEqual([
                    "node_modules",
                    "dist",
                    ".git",
                ]);
                expect(parsed.dictionary).toEqual({ SomeFeature: "Auth" });
            });
        },
    );

    await t.step(
        "aborts existing config when prompt answer is no",
        async () => {
            await with_temp_dir("plopper-init-abort-", async (tmp) => {
                const config_file = path.join(tmp, "config.toml");
                await Deno.writeTextFile(config_file, 'input_dir = "old"\n');

                await with_mock_prompt(["n"], async () => {
                    await cli(["init", `--config-path=${config_file}`]);
                });
                expect(await Deno.readTextFile(config_file)).toBe(
                    'input_dir = "old"\n',
                );
            });
        },
    );

    await t.step(
        "reuses existing config and applies CLI overrides",
        async () => {
            await with_temp_dir("plopper-init-reuse-", async (tmp) => {
                const config_file = path.join(tmp, "config.toml");
                await Deno.writeTextFile(
                    config_file,
                    [
                        'input_dir = "old-template"',
                        'output_dir = "old-output"',
                        'ignore_blobs = ["dist"]',
                        "[dictionary]",
                        'OLD = "from_file"',
                    ].join("\n"),
                );

                await with_mock_prompt(["y", "y"], async () => {
                    await cli([
                        "init",
                        `--config-path=${config_file}`,
                        "--output=new-output",
                        "--dictionary=NEW=from_cli",
                        "--dictionary=OLD=overridden",
                    ]);
                });

                const parsed = parse_toml(
                    await Deno.readTextFile(config_file),
                ) as Record<
                    string,
                    unknown
                >;
                expect(parsed.input_dir).toBe("old-template");
                expect(parsed.output_dir).toBe("new-output");
                expect(parsed.ignore_blobs).toEqual(["dist"]);
                expect(parsed.dictionary).toEqual({
                    OLD: "overridden",
                    NEW: "from_cli",
                });
            });
        },
    );

    await t.step("reports invalid existing config when reusing", async () => {
        await with_temp_dir("plopper-init-invalid-reuse-", async (tmp) => {
            const config_file = path.join(tmp, "config.toml");
            await Deno.writeTextFile(config_file, "invalid [[[");

            const result = await run_cli([
                "init",
                `--config-path=${config_file}`,
                "--force",
                "--reuse-existing",
            ]);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain("Error loading existing config");
            expect(result.stderr).toContain("Use existing config as base");
        });
    });

    await t.step(
        "force overwrites existing config without prompt",
        async () => {
            await with_temp_dir("plopper-init-force-", async (tmp) => {
                const config_file = path.join(tmp, "config.toml");
                await Deno.writeTextFile(config_file, 'input_dir = "old"\n');

                const result = await run_cli([
                    "init",
                    `--config-path=${config_file}`,
                    "--force",
                    "--input=new-template",
                ]);
                expect(result.code).toBe(0);

                const parsed = parse_toml(
                    await Deno.readTextFile(config_file),
                ) as Record<
                    string,
                    unknown
                >;
                expect(parsed.input_dir).toBe("new-template");
                expect(parsed.output_dir).toBe(undefined);
            });
        },
    );

    await t.step(
        "rejects invalid dictionary and mismatched markers",
        async () => {
            const bad_dict = await run_cli(["init", "--dictionary=invalid"]);
            expect(bad_dict.code).toBe(1);
            expect(bad_dict.stderr).toContain("Invalid --dictionary entry");

            const bad_markers = await run_cli([
                "init",
                "--start-replacement=_place_",
            ]);
            expect(bad_markers.code).toBe(1);
            expect(bad_markers.stderr).toContain(
                "--start-replacement and --end-replacement",
            );
        },
    );
});

Deno.test("generate CLI validation and argument forms", async (t) => {
    await t.step("uses config-only required args", async () => {
        await with_temp_dir("plopper-generate-config-only-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            const config_file = path.join(tmp, "config.toml");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(path.join(input_dir, "x.txt"), "NAME");
            await Deno.writeTextFile(
                config_file,
                [
                    `input_dir = "${input_dir}"`,
                    `output_dir = "${output_dir}"`,
                    "[dictionary]",
                    'NAME = "Nik"',
                ].join("\n"),
            );

            const result = await run_cli([
                "generate",
                `--config-path=${config_file}`,
            ]);
            expect(result.code).toBe(0);
            expect(await Deno.readTextFile(path.join(output_dir, "x.txt")))
                .toBe(
                    "Nik",
                );
        });
    });

    await t.step("CLI overrides one config-required arg", async () => {
        await with_temp_dir(
            "plopper-generate-config-override-",
            async (tmp) => {
                const input_dir = path.join(tmp, "input");
                const old_output = path.join(tmp, "old-output");
                const new_output = path.join(tmp, "new-output");
                const config_file = path.join(tmp, "config.toml");
                await Deno.mkdir(input_dir);
                await Deno.writeTextFile(
                    path.join(input_dir, "x.txt"),
                    "content",
                );
                await Deno.writeTextFile(
                    config_file,
                    [
                        `input_dir = "${input_dir}"`,
                        `output_dir = "${old_output}"`,
                    ].join(
                        "\n",
                    ),
                );

                const result = await run_cli([
                    "generate",
                    `--config-path=${config_file}`,
                    `--output=${new_output}`,
                ]);
                expect(result.code).toBe(0);
                expect(
                    await Deno.stat(path.join(new_output, "x.txt")).then(() =>
                        true
                    ),
                )
                    .toBe(true);
                expect(await Deno.stat(old_output).catch(() => null)).toBe(
                    null,
                );
            },
        );
    });

    await t.step("reports missing required args", async () => {
        const result = await run_cli(["generate"]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("Missing required argument");
        expect(result.stderr).toContain("--input");
        expect(result.stderr).toContain("--output");
    });

    await t.step("supports documented dictionary argument forms", async () => {
        await with_temp_dir("plopper-generate-dict-forms-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(path.join(input_dir, "x.txt"), "A B C");

            const result = await run_cli([
                "generate",
                `--input=${input_dir}`,
                `--output=${output_dir}`,
                "--dictionary",
                "A=one",
                "B=two",
                "--dictionary",
                "C=three=four",
            ]);
            expect(result.code).toBe(0);
            expect(await Deno.readTextFile(path.join(output_dir, "x.txt")))
                .toBe(
                    "one two three=four",
                );
        });
    });

    await t.step("honors ignore blocks via CLI flags", async () => {
        await with_temp_dir("plopper-generate-ignore-blocks-", async (tmp) => {
            const input_dir = path.join(tmp, "input");
            const output_dir = path.join(tmp, "output");
            await Deno.mkdir(input_dir);
            await Deno.writeTextFile(
                path.join(input_dir, "x.txt"),
                ["keep", "START", "drop", "END", "NAME"].join("\n"),
            );

            const result = await run_cli([
                "generate",
                `--input=${input_dir}`,
                `--output=${output_dir}`,
                "--start-to-ignore=START",
                "--end-to-ignore=END",
                "--dictionary=NAME=Nik",
            ]);
            expect(result.code).toBe(0);
            expect(await Deno.readTextFile(path.join(output_dir, "x.txt")))
                .toBe(
                    "keep\nNik",
                );
        });
    });

    await t.step("reports bad config path and missing input path", async () => {
        const bad_config = await run_cli([
            "generate",
            "--config-path=/definitely/missing/plopper.toml",
        ]);
        expect(bad_config.code).toBe(1);
        expect(bad_config.stderr).toContain("Error loading config file");
        expect(bad_config.stderr).toContain("--config-path");

        await with_temp_dir("plopper-generate-missing-input-", async (tmp) => {
            const output_dir = path.join(tmp, "output");
            const missing_input = path.join(tmp, "missing");
            const result = await run_cli([
                "generate",
                `--input=${missing_input}`,
                `--output=${output_dir}`,
            ]);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain("generate failed");
            expect(result.stderr).toContain("Input is not a directory");
            expect(result.stderr).toContain("--input");
        });
    });
});
