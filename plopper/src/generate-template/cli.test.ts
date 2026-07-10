import { expect } from "@std/expect";
import * as path from "@std/path";
import { cli } from "./cli.ts";

/**
 * Integration tests for configuration layering in CLI.
 * Focus: Verify that defaults → config file → CLI args layers work correctly
 */
Deno.test("CLI configuration layering", async (t) => {
    await t.step(
        "Layer 1: defaults are applied when no config provided",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "layer1-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            try {
                await Deno.writeTextFile(
                    path.join(input_dir, "file.txt"),
                    "content",
                );

                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                ]);

                const file_exists = await Deno.stat(
                    path.join(temp_dir, "file.txt"),
                )
                    .catch(() => null);
                expect(file_exists?.isFile).toBe(true);
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "Layer 2: config file ignore_blobs override defaults",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "layer2-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            const cfg_dir = await Deno.makeTempDir({ prefix: "cfg-" });
            try {
                // Create structure: skip/file.txt and keep/file.txt
                await Deno.mkdir(path.join(input_dir, "skip"));
                await Deno.mkdir(path.join(input_dir, "keep"));
                await Deno.writeTextFile(
                    path.join(input_dir, "skip", "file.txt"),
                    "skip",
                );
                await Deno.writeTextFile(
                    path.join(input_dir, "keep", "file.txt"),
                    "keep",
                );

                // Config: ignore 'skip' directory
                const cfg_file = path.join(cfg_dir, "config.toml");
                await Deno.writeTextFile(cfg_file, 'ignore_blobs = ["skip"]\n');

                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                    `--config-path=${cfg_file}`,
                ]);

                // Verify config's ignore_blobs was applied
                const skip_exists = await Deno.stat(
                    path.join(temp_dir, "skip"),
                ).catch(() => null);
                const keep_exists = await Deno.stat(
                    path.join(temp_dir, "keep"),
                ).catch(() => null);

                expect(skip_exists).toBe(null); // ignored
                expect(keep_exists?.isDirectory).toBe(true); // kept
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(cfg_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "Layer 3: CLI ignore_blobs overrides config file ignore_blobs",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "layer3-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            const cfg_dir = await Deno.makeTempDir({ prefix: "cfg-" });
            try {
                // Create: dist/index.js, build/output.js, src/code.js
                await Deno.mkdir(path.join(input_dir, "dist"));
                await Deno.mkdir(path.join(input_dir, "build"));
                await Deno.mkdir(path.join(input_dir, "src"));
                await Deno.writeTextFile(
                    path.join(input_dir, "dist", "index.js"),
                    "dist",
                );
                await Deno.writeTextFile(
                    path.join(input_dir, "build", "output.js"),
                    "build",
                );
                await Deno.writeTextFile(
                    path.join(input_dir, "src", "code.js"),
                    "src",
                );

                // Config: ignore 'dist'
                const cfg_file = path.join(cfg_dir, "config.toml");
                await Deno.writeTextFile(cfg_file, 'ignore_blobs = ["dist"]\n');

                // CLI: override to ignore 'build' instead
                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                    `--config-path=${cfg_file}`,
                    `--ignore-blobs=build`,
                ]);

                // Verify: build ignored (CLI override), dist NOT ignored (CLI replaced config)
                const dist_exists = await Deno.stat(path.join(temp_dir, "dist"))
                    .catch(() => null);
                const build_exists = await Deno.stat(
                    path.join(temp_dir, "build"),
                )
                    .catch(() => null);
                const src_exists = await Deno.stat(path.join(temp_dir, "src"))
                    .catch(() => null);

                expect(dist_exists?.isDirectory).toBe(true); // NOT ignored
                expect(build_exists).toBe(null); // ignored by CLI
                expect(src_exists?.isDirectory).toBe(true); // not mentioned, kept
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(cfg_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "Config markers + CLI dictionary override: markers preserved",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "markers-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            const cfg_dir = await Deno.makeTempDir({ prefix: "cfg-" });
            try {
                // Input: _start_KEY_end_
                await Deno.writeTextFile(
                    path.join(input_dir, "file.txt"),
                    "_start_KEY_end_",
                );

                // Config: markers + dict
                const cfg_file = path.join(cfg_dir, "config.toml");
                const lines = [
                    'start_replacement = "_start_"',
                    'end_replacement = "_end_"',
                    "[dictionary]",
                    'KEY = "from_config"',
                ];
                await Deno.writeTextFile(cfg_file, lines.join("\n"));

                // CLI: override dict value
                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                    `--config-path=${cfg_file}`,
                    `--dictionary=KEY=from_cli`,
                ]);

                // Result should use CLI value without markers (markers are delimiters, not part of output)
                const output = await Deno.readTextFile(
                    path.join(temp_dir, "file.txt"),
                );
                expect(output).toBe("from_cli");
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(cfg_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "Config dictionary used for word-boundary replacements",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "dict-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            const cfg_dir = await Deno.makeTempDir({ prefix: "cfg-" });
            try {
                // Input: "OldName is used"
                await Deno.writeTextFile(
                    path.join(input_dir, "file.txt"),
                    "OldName is used",
                );

                // Config: dictionary (no markers = word-boundary mode)
                const cfg_file = path.join(cfg_dir, "config.toml");
                const lines = [
                    "[dictionary]",
                    'OldName = "NewName"',
                    'used = "applied"',
                ];
                await Deno.writeTextFile(cfg_file, lines.join("\n"));

                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                    `--config-path=${cfg_file}`,
                ]);

                // Both dict entries should be applied
                const output = await Deno.readTextFile(
                    path.join(temp_dir, "file.txt"),
                );
                expect(output).toBe("NewName is applied");
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(cfg_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "All three layers: defaults + config + CLI",
        async () => {
            const temp_dir = await Deno.makeTempDir({ prefix: "all3-" });
            const input_dir = await Deno.makeTempDir({ prefix: "input-" });
            const cfg_dir = await Deno.makeTempDir({ prefix: "cfg-" });
            try {
                // Create: dist/a.txt, src/_OLD_FEATURE_.ts
                await Deno.mkdir(path.join(input_dir, "dist"));
                await Deno.mkdir(path.join(input_dir, "src"));
                await Deno.writeTextFile(
                    path.join(input_dir, "dist", "a.txt"),
                    "dist",
                );
                await Deno.writeTextFile(
                    path.join(input_dir, "src", "_OLD_FEATURE_.ts"),
                    "export const _OLD_FEATURE_ = true;",
                );

                // Config: ignore dist, use markers, provide FEATURE dict
                const cfg_file = path.join(cfg_dir, "config.toml");
                const lines = [
                    'ignore_blobs = ["dist"]',
                    'start_replacement = "_"',
                    'end_replacement = "_"',
                    "[dictionary]",
                    'OLD_FEATURE = "NewFeature"',
                ];
                await Deno.writeTextFile(cfg_file, lines.join("\n"));

                // CLI: override FEATURE value
                await cli([
                    `--input=${input_dir}`,
                    `--output=${temp_dir}`,
                    `--config-path=${cfg_file}`,
                    `--dictionary=OLD_FEATURE=BetterFeature`,
                ]);

                // Verify all layers applied correctly:
                // 1. dist ignored (from config)
                const dist_exists = await Deno.stat(path.join(temp_dir, "dist"))
                    .catch(() => null);
                expect(dist_exists).toBe(null);

                // 2. src exists (default behavior)
                const src_exists = await Deno.stat(path.join(temp_dir, "src"))
                    .catch(() => null);
                expect(src_exists?.isDirectory).toBe(true);

                // 3. Markers applied with CLI dict value
                const output = await Deno.readTextFile(
                    path.join(temp_dir, "src", "BetterFeature.ts"),
                );
                expect(output).toBe(
                    "export const BetterFeature = true;",
                );
            } finally {
                await Deno.remove(temp_dir, { recursive: true });
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(cfg_dir, { recursive: true });
            }
        },
    );
});
