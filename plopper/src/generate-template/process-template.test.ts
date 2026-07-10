import { expect } from "@std/expect";
import * as path from "@std/path";
import * as fs from "@std/fs";
import {
    process_template,
    strip_ignored_blocks,
    transform_string,
} from "./process-template.ts";

const FIXTURE_INPUT = path.resolve(
    import.meta.dirname!,
    "../../_place_some-feature_holder_",
);

Deno.test(transform_string.name, async (t) => {
    await t.step("replaces known keys with markers", () => {
        expect(
            transform_string("hello _place_some-feature_holder_!", {
                start_replacement: "_place_",
                end_replacement: "_holder_",
                dictionary: { "some-feature": "example" },
            }),
        ).toBe("hello example!");
    });

    await t.step("leaves unknown keys untouched with markers", () => {
        expect(
            transform_string("_place_unknown_holder_", {
                start_replacement: "_place_",
                end_replacement: "_holder_",
                dictionary: { "some-feature": "example" },
            }),
        ).toBe("_place_unknown_holder_");
    });

    await t.step("replaces multiple keys on one line with markers", () => {
        expect(
            transform_string(
                "@/_place_SomeFeature_holder_/_place_some-feature_holder_",
                {
                    start_replacement: "_place_",
                    end_replacement: "_holder_",
                    dictionary: {
                        "some-feature": "example",
                        "SomeFeature": "Example",
                    },
                },
            ),
        ).toBe("@/Example/example");
    });

    await t.step(
        "replaces dictionary pairs directly without markers (word boundaries)",
        () => {
            expect(
                transform_string("hello MyFeature world", {
                    dictionary: { "MyFeature": "YourFeature" },
                }),
            ).toBe("hello YourFeature world");
        },
    );

    await t.step(
        "replaces literal strings without word boundary restrictions",
        () => {
            expect(
                transform_string("myFeature myFeatureExtra", {
                    dictionary: { "myFeature": "yourFeature" },
                }),
            ).toBe("yourFeature yourFeatureExtra");
        },
    );

    await t.step(
        "replaces multiple dictionary pairs without markers",
        () => {
            expect(
                transform_string("FooBar with BazQux inside", {
                    dictionary: {
                        "FooBar": "HelloWorld",
                        "BazQux": "TestCode",
                    },
                }),
            ).toBe("HelloWorld with TestCode inside");
        },
    );

    await t.step(
        "longest key wins when one key is a prefix of another (no markers)",
        () => {
            expect(
                transform_string("SomeFeatureInterface and SomeFeature", {
                    dictionary: {
                        "SomeFeature": "Auth",
                        "SomeFeatureInterface": "AuthInterface",
                    },
                }),
            ).toBe("AuthInterface and Auth");
        },
    );

    await t.step(
        "does not cascade: a value is never re-scanned for later keys",
        () => {
            expect(
                transform_string("A", {
                    dictionary: { "A": "B", "B": "C" },
                }),
            ).toBe("B");
        },
    );

    await t.step(
        "throws error when only start_replacement is provided",
        () => {
            expect(() => {
                transform_string("test", {
                    start_replacement: "_place_",
                    dictionary: {},
                });
            }).toThrow(
                new Error(
                    "start_replacement and end_replacement must be both provided or both omitted",
                ),
            );
        },
    );

    await t.step(
        "throws error when only end_replacement is provided",
        () => {
            expect(() => {
                transform_string("test", {
                    end_replacement: "_holder_",
                    dictionary: {},
                });
            }).toThrow(
                new Error(
                    "start_replacement and end_replacement must be both provided or both omitted",
                ),
            );
        },
    );
});

Deno.test(strip_ignored_blocks.name, () => {
    const source = [
        "keep1",
        "/// template ignore start",
        "drop1",
        "drop2",
        "/// template ignore end",
        "keep2",
    ].join("\n");

    expect(
        strip_ignored_blocks(
            source,
            "/// template ignore start",
            "/// template ignore end",
        ),
    ).toBe(["keep1", "keep2"].join("\n"));
});

Deno.test(process_template.name, async (t) => {
    await t.step(
        "transforms fixture _place_some-feature_holder_ into a real folder",
        async () => {
            const output_dir = await Deno.makeTempDir({ prefix: "tpl-out-" });
            try {
                await process_template({
                    input_dir: FIXTURE_INPUT,
                    output_dir,
                    start_replacement: "_place_",
                    end_replacement: "_holder_",
                    dictionary: {
                        "some-feature": "example",
                        "SomeFeature": "Example",
                        "SomeFeatureInterface": "ExampleInterface",
                        "some-variant": "simple",
                        "SomeVariant": "Simple",
                    },
                    ignore_blobs: ["node_modules", "dist"],
                });

                const feature_tag_path = path.join(
                    output_dir,
                    "feature-tag.example.ts",
                );
                expect(await fs.exists(feature_tag_path)).toBe(true);
                const feature_tag_content = await Deno.readTextFile(
                    feature_tag_path,
                );
                expect(feature_tag_content).toBe(
                    `export const FeatureTag = "@/Example" as const;\n`,
                );
            } finally {
                await Deno.remove(output_dir, { recursive: true });
            }
        },
    );

    await t.step("strips ignore blocks before replacement", async () => {
        const input_dir = await Deno.makeTempDir({ prefix: "tpl-in-" });
        const output_dir = await Deno.makeTempDir({ prefix: "tpl-out-" });
        try {
            await Deno.writeTextFile(
                path.join(input_dir, "sample._place_feat_holder_.ts"),
                [
                    "export const a = '_place_feat_holder_';",
                    "/// template ignore start",
                    "this line is dropped",
                    "/// template ignore end",
                    "export const b = '_place_feat_holder_';",
                ].join("\n"),
            );

            await process_template({
                input_dir,
                output_dir,
                start_replacement: "_place_",
                end_replacement: "_holder_",
                start_to_ignore: "/// template ignore start",
                end_to_ignore: "/// template ignore end",
                dictionary: { feat: "demo" },
            });

            const out = await Deno.readTextFile(
                path.join(output_dir, "sample.demo.ts"),
            );
            expect(out).toBe(
                [
                    "export const a = 'demo';",
                    "export const b = 'demo';",
                ].join("\n"),
            );
        } finally {
            await Deno.remove(input_dir, { recursive: true });
            await Deno.remove(output_dir, { recursive: true });
        }
    });

    await t.step(
        "throws error when both are required but provided separately",
        async () => {
            const input_dir = await Deno.makeTempDir({ prefix: "tpl-in-" });
            const output_dir = await Deno.makeTempDir({ prefix: "tpl-out-" });
            try {
                await expect(
                    process_template({
                        input_dir,
                        output_dir,
                        start_replacement: "_place_",
                        dictionary: {},
                    }),
                ).rejects.toThrow();
            } finally {
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(output_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "replaces using dictionary pairs without markers",
        async () => {
            const input_dir = await Deno.makeTempDir({ prefix: "tpl-in-" });
            const output_dir = await Deno.makeTempDir({ prefix: "tpl-out-" });
            try {
                await Deno.writeTextFile(
                    path.join(input_dir, "MyFeature.ts"),
                    [
                        "export class MyFeature {",
                        "  name: string = 'MyFeature';",
                        "}",
                    ].join("\n"),
                );

                await process_template({
                    input_dir,
                    output_dir,
                    dictionary: { "MyFeature": "Example" },
                });

                const out = await Deno.readTextFile(
                    path.join(output_dir, "Example.ts"),
                );
                expect(out).toBe(
                    [
                        "export class Example {",
                        "  name: string = 'Example';",
                        "}",
                    ].join("\n"),
                );
            } finally {
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(output_dir, { recursive: true });
            }
        },
    );

    await t.step(
        "replaces literal strings with special symbols",
        () => {
            expect(
                transform_string("hello @feature-name! test @feature-name?", {
                    dictionary: { "@feature-name": "@example-name" },
                }),
            ).toBe("hello @example-name! test @example-name?");
        },
    );
});
