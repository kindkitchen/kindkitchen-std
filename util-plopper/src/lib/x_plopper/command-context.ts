import * as fs from "@std/fs";
import * as path from "@std/path";

type FilePath = string | URL;
type ExistsOptions = Parameters<typeof fs.exists>[1];

export type CommandContext = {
    dry_run: boolean;
    notice: (message: string) => void;
    exists: (file_path: FilePath, options?: ExistsOptions) => Promise<boolean>;
    ensure_dir: (directory_path: FilePath) => Promise<void>;
    read_text_file: (file_path: FilePath) => Promise<string>;
    write_text_file: (
        file_path: FilePath,
        data: string,
        options?: Deno.WriteFileOptions,
    ) => Promise<void>;
};

type CreateCommandContextOptions = {
    dry_run?: boolean;
    notice?: (message: string) => void;
};

const path_key = (file_path: FilePath) =>
    file_path instanceof URL && file_path.protocol === "file:"
        ? path.fromFileUrl(file_path)
        : String(file_path);

const format_path = (file_path: FilePath) =>
    file_path instanceof URL ? file_path.href : file_path;

export const create_command_context = (
    options: CreateCommandContextOptions = {},
): CommandContext => {
    const dry_run = Boolean(options.dry_run);
    const notice = options.notice ?? console.log;
    const virtual_text_files = new Map<string, string>();
    const virtual_directories = new Set<string>();

    return {
        dry_run,
        notice,
        exists: async (file_path, exists_options) => {
            const key = path_key(file_path);

            if (!exists_options?.isDirectory && virtual_text_files.has(key)) {
                return true;
            }
            if (!exists_options?.isFile && virtual_directories.has(key)) {
                return true;
            }

            return await fs.exists(file_path, exists_options);
        },
        ensure_dir: async (directory_path) => {
            if (!dry_run) {
                await fs.ensureDir(directory_path);
                return;
            }

            virtual_directories.add(path_key(directory_path));
            notice(
                `[dry-run] would ensure directory: ${
                    format_path(directory_path)
                }`,
            );
        },
        read_text_file: async (file_path) => {
            const key = path_key(file_path);
            const virtual_text_file = virtual_text_files.get(key);

            if (virtual_text_file !== undefined) return virtual_text_file;

            return await Deno.readTextFile(file_path);
        },
        write_text_file: async (file_path, data, write_options) => {
            if (!dry_run) {
                await Deno.writeTextFile(file_path, data, write_options);
                return;
            }

            virtual_text_files.set(path_key(file_path), data);
            notice(`[dry-run] would write file: ${format_path(file_path)}`);
        },
    };
};
