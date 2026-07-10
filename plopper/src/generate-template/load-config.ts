import * as path from "@std/path";
import { parse as parse_toml } from "@std/toml";
import type { ProcessTemplateOptions } from "./process-template.ts";

/**
 * Validates that a loaded config object conforms to ProcessTemplateOptions schema.
 * Returns only the fields that are defined in ProcessTemplateOptions.
 */
export function validate_config(
    data: unknown,
): Partial<ProcessTemplateOptions> {
    if (!data || typeof data !== "object") {
        throw new Error(
            "Config must be a valid object",
        );
    }

    const config = data as Record<string, unknown>;
    const validated: Partial<ProcessTemplateOptions> = {};

    // Validate optional string fields
    for (
        const field of [
            "input_dir",
            "output_dir",
            "start_replacement",
            "end_replacement",
            "start_to_ignore",
            "end_to_ignore",
        ] as const
    ) {
        if (field in config) {
            if (typeof config[field] !== "string") {
                throw new Error(
                    `Config field "${field}" must be a string, got ${typeof config[
                        field
                    ]}`,
                );
            }
            validated[field] = config[field] as string;
        }
    }

    // Validate dictionary (must be object with string values)
    if ("dictionary" in config) {
        if (
            typeof config.dictionary !== "object" || config.dictionary === null
        ) {
            throw new Error(
                `Config field "dictionary" must be an object, got ${typeof config
                    .dictionary}`,
            );
        }
        const dict = config.dictionary as Record<string, unknown>;
        const validated_dict: Record<string, string> = {};
        for (const [key, value] of Object.entries(dict)) {
            if (typeof value !== "string") {
                throw new Error(
                    `Config field "dictionary.${key}" must be a string, got ${typeof value}`,
                );
            }
            validated_dict[key] = value;
        }
        validated.dictionary = validated_dict;
    }

    // Validate ignore_blobs (must be array of strings)
    if ("ignore_blobs" in config) {
        if (!Array.isArray(config.ignore_blobs)) {
            throw new Error(
                `Config field "ignore_blobs" must be an array, got ${typeof config
                    .ignore_blobs}`,
            );
        }
        const blobs = (config.ignore_blobs as unknown[]).map((blob, idx) => {
            if (typeof blob !== "string") {
                throw new Error(
                    `Config field "ignore_blobs[${idx}]" must be a string, got ${typeof blob}`,
                );
            }
            return blob;
        });
        validated.ignore_blobs = blobs;
    }

    return validated;
}

/**
 * Converts a configuration object to TOML string format.
 * Includes all fields (with defaults/examples) for use as a template.
 * Handles nested objects and arrays appropriately.
 */
export function stringify_config(
    config: Partial<ProcessTemplateOptions>,
    include_examples = false,
): string {
    const lines: string[] = [];

    // Add scalar fields first
    for (
        const field of [
            "input_dir",
            "output_dir",
            "start_replacement",
            "end_replacement",
            "start_to_ignore",
            "end_to_ignore",
        ] as const
    ) {
        if (config[field] !== undefined) {
            const value = config[field] as string;
            lines.push(`${field} = "${escape_toml_string(value)}"`);
        } else if (include_examples) {
            // Include commented examples
            const example = get_field_example(field);
            lines.push(`# ${field} = "${example}"`);
        }
    }

    // Add ignore_blobs array
    if (config.ignore_blobs && config.ignore_blobs.length > 0) {
        const escaped = config.ignore_blobs.map((b) =>
            `"${escape_toml_string(b)}"`
        )
            .join(", ");
        lines.push(`ignore_blobs = [${escaped}]`);
    } else if (include_examples) {
        lines.push(`# ignore_blobs = ["node_modules", "dist", ".git"]`);
    }

    // Add dictionary section
    if (config.dictionary && Object.keys(config.dictionary).length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push("[dictionary]");
        for (const [key, value] of Object.entries(config.dictionary)) {
            lines.push(`${key} = "${escape_toml_string(value)}"`);
        }
        if (include_examples) {
            lines.push(`# PROJECT_NAME = "MyProject"`);
            lines.push(`# AUTHOR = "Nik"`);
            lines.push(`# VERSION = "1.0.0"`);
        }
    } else if (include_examples) {
        if (lines.length > 0) lines.push("");
        lines.push("[dictionary]");
        lines.push(
            `# Keys to replace in template files (e.g., {{PROJECT_NAME}})`,
        );
        lines.push(`# PROJECT_NAME = "MyProject"`);
        lines.push(`# AUTHOR = "Nik"`);
        lines.push(`# VERSION = "1.0.0"`);
    }

    return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

function get_field_example(field: string): string {
    const examples: Record<string, string> = {
        "input_dir": "./template",
        "output_dir": "./output",
        "start_replacement": "{{",
        "end_replacement": "}}",
        "start_to_ignore": "<!-- REMOVE -->",
        "end_to_ignore": "<!-- /REMOVE -->",
    };
    return examples[field] || "";
}

function escape_toml_string(str: string): string {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

/**
 * Loads and parses a TOML config file.
 * Validates the parsed content and returns a typed configuration object.
 * Throws if file doesn't exist or is invalid.
 */
export async function load_config_file(
    config_path: string,
): Promise<Partial<ProcessTemplateOptions>> {
    const resolved_path = path.resolve(config_path);

    // Check if file exists
    let stat: Deno.FileInfo | null = null;
    try {
        stat = await Deno.stat(resolved_path);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            throw new Error(
                `Config file not found: ${resolved_path}`,
            );
        }
        throw new Error(
            `Failed to access config file at ${resolved_path}: ${
                err instanceof Error ? err.message : String(err)
            }`,
        );
    }

    if (!stat.isFile) {
        throw new Error(
            `Config path is not a file: ${resolved_path}`,
        );
    }

    // Read and parse TOML
    let content: string;
    try {
        content = await Deno.readTextFile(resolved_path);
    } catch (err) {
        throw new Error(
            `Failed to read config file: ${
                err instanceof Error ? err.message : String(err)
            }`,
        );
    }

    let parsed: unknown;
    try {
        parsed = parse_toml(content);
    } catch (err) {
        throw new Error(
            `Failed to parse TOML config: ${
                err instanceof Error ? err.message : String(err)
            }`,
        );
    }

    // Validate against schema
    return validate_config(parsed);
}
