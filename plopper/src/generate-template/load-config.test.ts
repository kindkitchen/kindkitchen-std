import { expect } from "@std/expect";
import * as path from "@std/path";
import { load_config_file, validate_config } from "./load-config.ts";

Deno.test(validate_config.name, async (t) => {
    await t.step("validates empty object", () => {
        const result = validate_config({});
        expect(result).toEqual({});
    });

    await t.step("validates string fields", () => {
        const result = validate_config({
            input_dir: "/input",
            output_dir: "/output",
            start_replacement: "_place_",
            end_replacement: "_holder_",
        });
        expect(result).toEqual({
            input_dir: "/input",
            output_dir: "/output",
            start_replacement: "_place_",
            end_replacement: "_holder_",
        });
    });

    await t.step("validates dictionary field", () => {
        const result = validate_config({
            dictionary: {
                MyFeature: "YourFeature",
                someKey: "someValue",
            },
        });
        expect(result.dictionary).toEqual({
            MyFeature: "YourFeature",
            someKey: "someValue",
        });
    });

    await t.step("validates ignore_blobs field", () => {
        const result = validate_config({
            ignore_blobs: ["node_modules", "dist", ".git"],
        });
        expect(result.ignore_blobs).toEqual(["node_modules", "dist", ".git"]);
    });

    await t.step("throws on non-object input", () => {
        expect(() => validate_config("not an object")).toThrow(
            new Error("Config must be a valid object"),
        );
    });

    await t.step("throws on invalid string field type", () => {
        expect(() => validate_config({ input_dir: 123 })).toThrow(
            new Error('Config field "input_dir" must be a string, got number'),
        );
    });

    await t.step("throws on invalid dictionary type", () => {
        expect(() => validate_config({ dictionary: "not an object" })).toThrow(
            new Error(
                'Config field "dictionary" must be an object, got string',
            ),
        );
    });

    await t.step("throws on invalid dictionary value type", () => {
        expect(() => validate_config({ dictionary: { key: 123 } })).toThrow(
            new Error(
                'Config field "dictionary.key" must be a string, got number',
            ),
        );
    });

    await t.step("throws on invalid ignore_blobs type", () => {
        expect(() => validate_config({ ignore_blobs: "not an array" })).toThrow(
            new Error(
                'Config field "ignore_blobs" must be an array, got string',
            ),
        );
    });

    await t.step("throws on invalid ignore_blobs element type", () => {
        expect(() => validate_config({ ignore_blobs: ["valid", 123] })).toThrow(
            new Error(
                'Config field "ignore_blobs[1]" must be a string, got number',
            ),
        );
    });
});

Deno.test(load_config_file.name, async (t) => {
    await t.step("loads and parses valid TOML config", async () => {
        const temp_dir = await Deno.makeTempDir({ prefix: "cfg-load-" });
        try {
            const config_file = path.join(temp_dir, "config.toml");
            await Deno.writeTextFile(
                config_file,
                `
input_dir = "/src"
output_dir = "/out"
start_replacement = "_place_"
end_replacement = "_holder_"
ignore_blobs = ["node_modules", "dist"]

[dictionary]
MyFeature = "Example"
oldName = "newName"
`,
            );

            const result = await load_config_file(config_file);
            expect(result.input_dir).toBe("/src");
            expect(result.output_dir).toBe("/out");
            expect(result.start_replacement).toBe("_place_");
            expect(result.end_replacement).toBe("_holder_");
            expect(result.dictionary).toEqual({
                MyFeature: "Example",
                oldName: "newName",
            });
            expect(result.ignore_blobs).toEqual(["node_modules", "dist"]);
        } finally {
            await Deno.remove(temp_dir, { recursive: true });
        }
    });

    await t.step("throws on missing file", async () => {
        await expect(load_config_file("/nonexistent/config.toml")).rejects
            .toThrow(
                new Error("Config file not found: /nonexistent/config.toml"),
            );
    });

    await t.step("throws on non-file path", async () => {
        const temp_dir = await Deno.makeTempDir({ prefix: "cfg-dir-" });
        try {
            await expect(load_config_file(temp_dir)).rejects.toThrow(
                new Error(`Config path is not a file: ${temp_dir}`),
            );
        } finally {
            await Deno.remove(temp_dir, { recursive: true });
        }
    });

    await t.step("throws on invalid TOML", async () => {
        const temp_dir = await Deno.makeTempDir({ prefix: "cfg-invalid-" });
        try {
            const config_file = path.join(temp_dir, "config.toml");
            await Deno.writeTextFile(
                config_file,
                `
invalid toml [[[
`,
            );

            await expect(load_config_file(config_file)).rejects.toThrow();
        } finally {
            await Deno.remove(temp_dir, { recursive: true });
        }
    });

    await t.step("throws on invalid config schema", async () => {
        const temp_dir = await Deno.makeTempDir({ prefix: "cfg-schema-" });
        try {
            const config_file = path.join(temp_dir, "config.toml");
            await Deno.writeTextFile(
                config_file,
                `
input_dir = 123
`,
            );

            await expect(load_config_file(config_file)).rejects.toThrow(
                new Error(
                    'Config field "input_dir" must be a string, got number',
                ),
            );
        } finally {
            await Deno.remove(temp_dir, { recursive: true });
        }
    });
});
