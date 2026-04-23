import * as std_cli from "@std/cli";
import * as std_fs from "@std/fs";
import * as std_path from "@std/path";
import * as std_regexp from "@std/regexp";

const skip = [
  std_regexp.escape("node_modules/"),
  std_regexp.escape(".github/"),
  std_regexp.escape(".dist/"),
].map((s) => new RegExp(s));

export async function md_files_to_txt(options: {
  root: string;
  follow_symlinks: boolean;
  output_path: string;
  exclude_regexes: string[];
  include_regexes: string[];
  exclude_globs: string[];
  include_globs: string[];
}): Promise<void> {
  const {
    root,
    follow_symlinks: follow_symlinks,
    output_path,
    exclude_regexes,
    include_regexes,
    /// TODO: Implement glob pattern matching in the future
    exclude_globs,
    /// TODO: Implement glob pattern matching in the future
    include_globs,
  } = options;
  const llm_chunks = [];

  // Track visited real paths to avoid duplicate traversal via symlinks
  const visited = new Set<string>();

  for await (
    const { path } of std_fs.walk(root, {
      includeDirs: false,
      exts: [".md"],
      followSymlinks: follow_symlinks,
      includeSymlinks: true,
      maxDepth: 10,
      skip: [...skip, ...exclude_regexes.map((regex) => new RegExp(regex))],
    })
  ) {
    let realPath: string;
    try {
      realPath = await Deno.realPath(path);
    } catch {
      // If realPath fails (e.g., broken symlink), skip
      continue;
    }

    if (visited.has(realPath)) {
      continue;
    }
    visited.add(realPath);

    if (
      include_regexes.length > 0 &&
      !include_regexes.some((regex) => new RegExp(regex).test(path))
    ) {
      continue;
    }

    const content = await Deno.readTextFile(path);
    const deep = path.split("/").length;
    const link = std_path.relative(root, path);
    llm_chunks.push({ content, deep, link });
  }

  llm_chunks.sort((a, b) => {
    if (a.deep === b.deep) {
      return a.link.localeCompare(b.link, undefined, { caseFirst: "upper" });
    } else {
      return a.deep - b.deep;
    }
  });

  (await std_fs.exists(output_path, { isFile: true })) &&
    (await Deno.remove(output_path));
  await std_fs.ensureFile(output_path);

  for (const chunk of llm_chunks) {
    const filename = chunk.link.split("/").at(-1) || chunk.link;
    if (filename.startsWith("_")) {
      continue;
    }

    await Deno.writeTextFile(
      output_path,
      `> [source](${chunk.link})\n\n` +
        chunk.content +
        `\n\n---\n---\n---\n\n\n\n`,
      {
        append: true,
      },
    );
  }
}

if (import.meta.main) {
  const {
    help,
    root = Deno.cwd(),
    follow_symlinks = false,
    output_path = "llm.txt",
    include_regexes = [] as string[],
    exclude_regexes = [] as string[],
    include_globs = [] as string[],
    exclude_globs = [] as string[],
  } = std_cli.parseArgs(Deno.args, {
    string: [
      "root",
      "output_path",
      "exclude_regexes",
      "include_regexes",
      "exclude_globs",
      "include_globs",
    ],
    boolean: ["help", "follow_symlinks"],
  });

  if (help) {
    console.info(
      `\
Usage: deno run --allow-read --allow-write md_files_to_txt.ts [options]
      
Options:
  --root <path>                Root directory to start traversal (default: current directory)
  --follow_symlinks            Whether to follow symbolic links (default: false)
  --output_path <path>         Path to output the resulting text file (default: llm.txt)
  --exclude_regexes <regexes>  Comma-separated list of regex patterns to exclude files/directories
  --include_regexes <regexes>  Comma-separated list of regex patterns to include files/directories
  --help                       Show this help message and exit
      `,
    );
    Deno.exit(0);
  }

  await md_files_to_txt({
    root,
    follow_symlinks,
    output_path,
    exclude_regexes: [exclude_regexes].flat(),
    include_regexes: [include_regexes].flat(),
    include_globs: [include_globs].flat(),
    exclude_globs: [exclude_globs].flat(),
  });
}
