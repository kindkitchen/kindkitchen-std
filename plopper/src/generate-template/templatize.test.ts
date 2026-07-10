import { expect } from "@std/expect";
import * as path from "@std/path";
import { cli } from "./cli.ts";

/**
 * templatize is the inverse of generate: real code -> template. These tests
 * drive it through the CLI and verify the code -> template -> code round-trip.
 */
Deno.test("templatize", async (t) => {
    await t.step(
        "turns real code into a marker template (names + contents)",
        async () => {
            const input_dir = await Deno.makeTempDir({ prefix: "real-" });
            const output_dir = await Deno.makeTempDir({ prefix: "tpl-" });
            try {
                await Deno.writeTextFile(
                    path.join(input_dir, "auth.ts"),
                    "export class Auth { name = 'auth'; }",
                );

                await cli([
                    "templatize",
                    `--input=${input_dir}`,
                    `--output=${output_dir}`,
                    "--start-replacement=_place_",
                    "--end-replacement=_holder_",
                    "--dictionary=auth=some-feature",
                    "--dictionary=Auth=SomeFeature",
                ]);

                const out = await Deno.readTextFile(
                    path.join(output_dir, "_place_some-feature_holder_.ts"),
                );
                expect(out).toBe(
                    "export class _place_SomeFeature_holder_ { name = '_place_some-feature_holder_'; }",
                );
            } finally {
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(output_dir, { recursive: true });
            }
        },
    );

    await t.step("round-trips back to the original via generate", async () => {
        const input_dir = await Deno.makeTempDir({ prefix: "real-" });
        const template_dir = await Deno.makeTempDir({ prefix: "tpl-" });
        const regen_dir = await Deno.makeTempDir({ prefix: "gen-" });
        try {
            const original = "export const Auth = '@/auth' as const;\n";
            await Deno.writeTextFile(path.join(input_dir, "auth.ts"), original);

            // code -> template
            await cli([
                "templatize",
                `--input=${input_dir}`,
                `--output=${template_dir}`,
                "--start-replacement=_place_",
                "--end-replacement=_holder_",
                "--dictionary=auth=some-feature",
                "--dictionary=Auth=SomeFeature",
            ]);

            // template -> code (inverse dictionary)
            await cli([
                "generate",
                `--input=${template_dir}`,
                `--output=${regen_dir}`,
                "--start-replacement=_place_",
                "--end-replacement=_holder_",
                "--dictionary=some-feature=auth",
                "--dictionary=SomeFeature=Auth",
            ]);

            const regenerated = await Deno.readTextFile(
                path.join(regen_dir, "auth.ts"),
            );
            expect(regenerated).toBe(original);
        } finally {
            await Deno.remove(input_dir, { recursive: true });
            await Deno.remove(template_dir, { recursive: true });
            await Deno.remove(regen_dir, { recursive: true });
        }
    });

    await t.step(
        "writes a bare placeholder when no markers given",
        async () => {
            const input_dir = await Deno.makeTempDir({ prefix: "real-" });
            const output_dir = await Deno.makeTempDir({ prefix: "tpl-" });
            try {
                await Deno.writeTextFile(
                    path.join(input_dir, "x.ts"),
                    "const auth = 1;",
                );

                await cli([
                    "templatize",
                    `--input=${input_dir}`,
                    `--output=${output_dir}`,
                    "--dictionary=auth=PLACEHOLDER",
                ]);

                const out = await Deno.readTextFile(
                    path.join(output_dir, "x.ts"),
                );
                expect(out).toBe("const PLACEHOLDER = 1;");
            } finally {
                await Deno.remove(input_dir, { recursive: true });
                await Deno.remove(output_dir, { recursive: true });
            }
        },
    );
});
