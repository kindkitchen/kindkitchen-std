import * as fs from "@std/fs";
import * as path from "@std/path";

export interface ProcessTemplateOptions {
    input_dir: string;
    output_dir: string;
    start_replacement?: string;
    end_replacement?: string;
    start_to_ignore?: string;
    end_to_ignore?: string;
    dictionary: Record<string, string>;
    ignore_blobs?: string[];
}

/**
 * Default configuration for ProcessTemplateOptions.
 * Optional fields with sensible defaults.
 * Required fields (input_dir, output_dir) must be provided explicitly.
 */
export const DEFAULT_PROCESS_TEMPLATE_OPTIONS: Partial<ProcessTemplateOptions> =
    {
        dictionary: {},
        ignore_blobs: [],
        start_replacement: undefined,
        end_replacement: undefined,
        start_to_ignore: undefined,
        end_to_ignore: undefined,
    };

export async function process_template(
    options: ProcessTemplateOptions,
): Promise<void> {
    // Merge user-provided options with defaults for complete configuration
    const merged: ProcessTemplateOptions = {
        ...DEFAULT_PROCESS_TEMPLATE_OPTIONS,
        ...options,
    } as ProcessTemplateOptions;

    const {
        input_dir,
        output_dir,
        start_replacement,
        end_replacement,
        start_to_ignore,
        end_to_ignore,
        dictionary,
        ignore_blobs = [],
    } = merged;

    if ((!!start_replacement) !== (!!end_replacement)) {
        throw new Error(
            "start_replacement and end_replacement must be both provided or both omitted",
        );
    }

    const input_root = path.resolve(input_dir);
    const output_root = path.resolve(output_dir);

    const input_stat = await Deno.stat(input_root).catch(() => null);
    if (!input_stat?.isDirectory) {
        throw new Error(`Input is not a directory: ${input_root}`);
    }

    await fs.ensureDir(output_root);

    const skip = ignore_blobs.length
        ? ignore_blobs.map((p) =>
            new RegExp(`(^|[\\\\/])${escape_regex(p)}([\\\\/]|$)`)
        )
        : undefined;

    for await (
        const entry of fs.walk(input_root, {
            includeDirs: true,
            includeFiles: true,
            includeSymlinks: false,
            skip,
        })
    ) {
        if (entry.path === input_root) continue;

        const rel = path.relative(input_root, entry.path);
        const rel_transformed = transform_string(rel, {
            start_replacement,
            end_replacement,
            dictionary,
        });
        const target = path.join(output_root, rel_transformed);

        if (entry.isDirectory) {
            await fs.ensureDir(target);
            continue;
        }

        if (entry.isFile) {
            await fs.ensureDir(path.dirname(target));
            let content: string;
            try {
                content = await Deno.readTextFile(entry.path);
            } catch {
                await Deno.copyFile(entry.path, target);
                continue;
            }
            if (start_to_ignore && end_to_ignore) {
                content = strip_ignored_blocks(
                    content,
                    start_to_ignore,
                    end_to_ignore,
                );
            }
            content = transform_string(content, {
                start_replacement,
                end_replacement,
                dictionary,
            });
            await Deno.writeTextFile(target, content);
        }
    }
}

export function transform_string(
    source: string,
    options: {
        start_replacement?: string;
        end_replacement?: string;
        dictionary: Record<string, string>;
    },
): string {
    const { start_replacement, end_replacement, dictionary } = options;
    if (start_replacement && end_replacement) {
        // When markers are the same, use greedy matching to avoid matching intermediate markers
        const is_same_marker = start_replacement === end_replacement;
        const quantifier = is_same_marker ? "+" : "+?";
        const pattern = new RegExp(
            `${escape_regex(start_replacement)}(.${quantifier})${
                escape_regex(end_replacement)
            }`,
            "g",
        );
        return source.replace(pattern, (match, key) => {
            return Object.hasOwn(dictionary, key) ? dictionary[key] : match;
        });
    }

    if (!start_replacement && !end_replacement) {
        // Single pass: replace every key simultaneously, longest key first, and
        // never re-scan substituted regions. This avoids two bugs of the naive
        // sequential approach: order-dependent clobbering (a short key eating a
        // longer one) and cascading re-replacement (a value containing a later key).
        const keys = Object.keys(dictionary)
            .filter((key) => key.length > 0)
            .sort((a, b) => b.length - a.length);
        if (!keys.length) return source;
        const pattern = new RegExp(keys.map(escape_regex).join("|"), "g");
        return source.replace(pattern, (match) => dictionary[match]);
    }

    throw new Error(
        "start_replacement and end_replacement must be both provided or both omitted",
    );
}

export function strip_ignored_blocks(
    source: string,
    start_marker: string,
    end_marker: string,
): string {
    const lines = source.split("\n");
    const result: string[] = [];
    let in_ignore = false;
    for (const line of lines) {
        if (!in_ignore && line.includes(start_marker)) {
            in_ignore = true;
            continue;
        }
        if (in_ignore) {
            if (line.includes(end_marker)) in_ignore = false;
            continue;
        }
        result.push(line);
    }
    return result.join("\n");
}

function escape_regex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
