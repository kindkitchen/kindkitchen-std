import * as std_cli from "@std/cli";
import * as std_fs from "@std/fs";
import * as std_path from "@std/path";
import * as std_regexp from "@std/regexp";

const skip = [
  std_regexp.escape("node_modules/"),
  std_regexp.escape(".github/"),
].map((s) => new RegExp(s));

export async function llm_txt_from_all_md(options: {
  root: string;
  followSymlinks: boolean;
}): Promise<void> {
  const {
    root,
    followSymlinks,
  } = options;
  const llm_txt_path = std_path.join(root, "llm.txt");
  const llm_chunks = [];

  // Track visited real paths to avoid duplicate traversal via symlinks
  const visited = new Set<string>();

  for await (
    const {
      path,
    } of std_fs.walk(root, {
      includeDirs: false,
      exts: [".md"],
      followSymlinks,
      includeSymlinks: true,
      maxDepth: 10,
      skip,
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

  await std_fs.exists(llm_txt_path, { isFile: true }) &&
    await Deno.remove(llm_txt_path);
  await std_fs.ensureFile(llm_txt_path);

  for (const chunk of llm_chunks) {
    const filename = chunk.link.split("/").at(-1) || chunk.link;
    if (filename.startsWith("_")) {
      continue;
    }

    await Deno.writeTextFile(
      llm_txt_path,
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
    root = Deno.cwd(),
    followSymlinks = false,
  } = std_cli.parseArgs(Deno.args, {
    string: ["root"],
    boolean: ["followSymlinks"],
  });

  await llm_txt_from_all_md({ root, followSymlinks });
}
