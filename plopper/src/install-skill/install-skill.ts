import * as path from "@std/path";

/**
 * Relative paths (under `skill/`) of every asset that travels with the package
 * and is copied into a consumer's project by {@link install_skill}. Keep this in
 * sync with the contents of the repo-root `skill/` directory.
 */
export const SKILL_ASSET_PATHS: readonly string[] = [
    "SKILL.md",
    "reference/config-schema.md",
    "reference/template-authoring.md",
    "templates/feature/_place_some-feature_holder_/mod._place_some-feature_holder_.ts",
    "templates/feature/_place_some-feature_holder_/_place_some-feature_holder_.types.ts",
];

export interface InstallSkillOptions {
    /** Destination directory the skill is written into (e.g. `./.claude/skills/plopper`). */
    dest: string;
    /** Overwrite files that already exist at the destination. */
    force?: boolean;
}

/**
 * Copies the bundled plopper skill (SKILL.md + reference docs + a starter
 * template) into `dest`. Assets are read relative to this module, so it works
 * both locally (file://) and when run from JSR (https://).
 *
 * Returns the list of absolute paths written. Throws if a target file already
 * exists and `force` is not set, or if a bundled asset cannot be read.
 */
export async function install_skill(
    options: InstallSkillOptions,
): Promise<string[]> {
    const dest_root = path.resolve(options.dest);
    const written: string[] = [];

    for (const rel of SKILL_ASSET_PATHS) {
        const source_url = import.meta.resolve(`../../skill/${rel}`);
        const response = await fetch(source_url);
        if (!response.ok) {
            throw new Error(
                `Failed to read bundled skill asset "${rel}" (${response.status})`,
            );
        }
        const content = await response.text();

        const target = path.join(dest_root, rel);
        if (!options.force) {
            const exists = await Deno.stat(target).then(() => true).catch(() =>
                false
            );
            if (exists) {
                throw new Error(
                    `Refusing to overwrite existing file (pass --force): ${target}`,
                );
            }
        }

        await Deno.mkdir(path.dirname(target), { recursive: true });
        await Deno.writeTextFile(target, content);
        written.push(target);
    }

    return written;
}
