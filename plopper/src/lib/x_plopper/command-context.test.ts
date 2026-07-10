import { expect } from "@std/expect";
import * as fs from "@std/fs";
import * as path from "@std/path";
import { create_command_context } from "./command-context.ts";

Deno.test(create_command_context.name, async (t) => {
    await t.step(
        "dry run tracks virtual filesystem effects without real writes",
        async () => {
            const temp_dir = await Deno.makeTempDir();
            const target_dir = path.join(temp_dir, "generated");
            const target_file = path.join(target_dir, "x.json");
            const target_file_url = path.toFileUrl(target_file);
            const notices: string[] = [];
            const command_context = create_command_context({
                dry_run: true,
                notice: (message) => notices.push(message),
            });

            try {
                await command_context.ensure_dir(target_dir);
                await command_context.write_text_file(
                    target_file_url,
                    "virtual content",
                );

                expect(
                    await command_context.exists(target_dir, {
                        isDirectory: true,
                    }),
                ).toBe(true);
                expect(
                    await command_context.exists(target_file, {
                        isFile: true,
                    }),
                ).toBe(true);
                expect(await command_context.read_text_file(target_file)).toBe(
                    "virtual content",
                );
                expect(await fs.exists(target_dir)).toBe(false);
                expect(await fs.exists(target_file)).toBe(false);
                expect(notices).toEqual([
                    `[dry-run] would ensure directory: ${target_dir}`,
                    `[dry-run] would write file: ${target_file_url.href}`,
                ]);
            } finally {
                await Deno.remove(temp_dir, { recursive: true }).catch(() => {
                });
            }
        },
    );

    await t.step("normal mode writes to the filesystem", async () => {
        const temp_dir = await Deno.makeTempDir();
        const target_dir = path.join(temp_dir, "generated");
        const target_file = path.join(target_dir, "x.json");
        const command_context = create_command_context();

        try {
            await command_context.ensure_dir(target_dir);
            await command_context.write_text_file(target_file, "real content");

            expect(await fs.exists(target_dir, { isDirectory: true })).toBe(
                true,
            );
            expect(await fs.exists(target_file, { isFile: true })).toBe(true);
            expect(await command_context.read_text_file(target_file)).toBe(
                "real content",
            );
        } finally {
            await Deno.remove(temp_dir, { recursive: true }).catch(() => {});
        }
    });
});
