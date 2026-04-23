import * as std_cli from "@std/cli";
import * as std_fs from "@std/fs";
import * as std_path from "@std/path";
import * as std_regexp from "@std/regexp";
import { globToRegExp } from "@std/path/glob-to-regexp";

// default skip patterns (match either forward or back slashes)
const defaultSkips = ["node_modules", ".github", ".dist"].map((s) =>
  new RegExp(std_regexp.escape(s) + "([/\\\\].*)?")
);

function splitAndTrim(input: string | string[]): string[] {
  return [input].flat()
    .filter(Boolean)
    .flatMap((s) => String(s).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

function globListToRegex(globs: string[]): RegExp[] {
  const out: RegExp[] = [];
  for (const g of globs) {
    try {
      out.push(globToRegExp(g, { extended: true, globstar: true }));
    } catch {
      // fallback: convert basic wildcards to regex
      const esc = std_regexp.escape(g).replace(/\\\*/g, "(.*)").replace(
        /\\\?/g,
        ".",
      );
      out.push(new RegExp(`^${esc}$`));
    }
  }
  return out;
}

export async function md_files_to_txt(options: {
  root: string;
  follow_symlinks: boolean;
  output_path: string;
  exclude_regexes: string[];
  include_regexes: string[];
  exclude_globs: string[];
  include_globs: string[];
  max_depth?: number;
}): Promise<void> {
  const {
    root,
    follow_symlinks,
    output_path,
    exclude_regexes,
    include_regexes,
    exclude_globs,
    include_globs,
    max_depth = 10,
  } = options;

  const includeRegexes = splitAndTrim(include_regexes).map((r) =>
    new RegExp(r)
  );
  const excludeRegexes = [
    ...defaultSkips,
    ...splitAndTrim(exclude_regexes).map((r) => new RegExp(r)),
  ];

  const includeGlobRegexes = globListToRegex(splitAndTrim(include_globs));
  const excludeGlobRegexes = globListToRegex(splitAndTrim(exclude_globs));

  const llm_chunks: { content: string; deep: number; link: string }[] = [];

  // Track visited real paths to avoid duplicate traversal via symlinks
  const visited = new Set<string>();

  for await (
    const entry of std_fs.walk(root, {
      includeDirs: false,
      exts: [".md"],
      followSymlinks: follow_symlinks,
      includeSymlinks: true,
      maxDepth: max_depth,
      skip: excludeRegexes,
    })
  ) {
    const path = entry.path;

    // compute a normalized relative path (posix-style) for matching and links
    const relativePathRaw = std_path.relative(root, path);
    const relativePath = relativePathRaw.replaceAll("\\\\", "/");

    // optionally filter by include regex/glob against the relative path
    if (
      includeRegexes.length > 0 &&
      !includeRegexes.some((rx) => rx.test(relativePath))
    ) {
      continue;
    }
    if (
      includeGlobRegexes.length > 0 &&
      !includeGlobRegexes.some((rx) => rx.test(relativePath))
    ) {
      continue;
    }

    // explicit exclude globs
    if (
      excludeGlobRegexes.length > 0 &&
      excludeGlobRegexes.some((rx) => rx.test(relativePath))
    ) {
      continue;
    }

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

    let content: string;
    try {
      content = await Deno.readTextFile(path);
    } catch (err) {
      console.error(`Failed to read ${path}: ${err}`);
      continue;
    }

    const deep = relativePath === "" ? 1 : relativePath.split(/[/\\]/).length;
    // Use posix-style links for markdown regardless of platform
    const link = relativePath;
    llm_chunks.push({ content, deep, link });
  }

  llm_chunks.sort((a, b) => {
    if (a.deep === b.deep) {
      return a.link.localeCompare(b.link, undefined, { caseFirst: "upper" });
    } else {
      return a.deep - b.deep;
    }
  });

  // prepare output
  if (await std_fs.exists(output_path, { isFile: true })) {
    try {
      await Deno.remove(output_path);
    } catch (err) {
      console.error(
        `Failed to remove existing output file ${output_path}: ${err}`,
      );
    }
  }
  await std_fs.ensureFile(output_path);

  const parts: string[] = [];
  for (const chunk of llm_chunks) {
    const filename = chunk.link.split("/").at(-1) || chunk.link;
    if (filename.startsWith("_")) {
      continue;
    }

    parts.push(`> [source](${chunk.link})\n\n` + chunk.content + `\n\n---\n\n`);
  }

  // write all at once
  try {
    await Deno.writeTextFile(output_path, parts.join("\n"));
  } catch (err) {
    console.error(`Failed to write output file ${output_path}: ${err}`);
    throw err;
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
  --exclude_globs <globs>      Comma-separated list of glob patterns to exclude files/directories
  --include_globs <globs>      Comma-separated list of glob patterns to include files/directories
  --help                       Show this help message and exit
      `,
    );
    Deno.exit(0);
  }

  await md_files_to_txt({
    root,
    follow_symlinks,
    output_path,
    exclude_regexes: splitAndTrim(exclude_regexes),
    include_regexes: splitAndTrim(include_regexes),
    include_globs: splitAndTrim(include_globs),
    exclude_globs: splitAndTrim(exclude_globs),
  });
}
