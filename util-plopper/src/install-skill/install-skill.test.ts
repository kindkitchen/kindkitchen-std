import { expect } from "@std/expect";
import * as path from "@std/path";
import { install_skill, SKILL_ASSET_PATHS } from "./install-skill.ts";

Deno.test("install_skill", async (t) => {
    await t.step("copies every bundled asset into dest", async () => {
        const dest = await Deno.makeTempDir({ prefix: "skill-" });
        try {
            const written = await install_skill({ dest });
            expect(written.length).toBe(SKILL_ASSET_PATHS.length);

            for (const rel of SKILL_ASSET_PATHS) {
                const stat = await Deno.stat(path.join(dest, rel)).catch(() =>
                    null
                );
                expect(stat?.isFile).toBe(true);
            }

            const skill_md = await Deno.readTextFile(
                path.join(dest, "SKILL.md"),
            );
            expect(skill_md).toContain("name: plopper");
        } finally {
            await Deno.remove(dest, { recursive: true });
        }
    });

    await t.step("refuses to overwrite without force", async () => {
        const dest = await Deno.makeTempDir({ prefix: "skill-" });
        try {
            await install_skill({ dest });
            await expect(install_skill({ dest })).rejects.toThrow();
            // force succeeds
            const written = await install_skill({ dest, force: true });
            expect(written.length).toBe(SKILL_ASSET_PATHS.length);
        } finally {
            await Deno.remove(dest, { recursive: true });
        }
    });
});
