// Run tests from the llm directory or provide the llm/deno.json import map to Deno:
// cd llm && deno test --allow-read --allow-write
// or from repo root:
// deno test --allow-read --allow-write --import-map=llm/deno.json llm

import { expect } from "@std/expect";
import { md_files_to_txt } from "./md_files_to_txt.ts";
import * as path from "@std/path";

async function makeFile(filePath: string, content = "") {
  await Deno.mkdir(path.dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, content);
}

Deno.test({
  name: "basic combination and exclusion of underscore files",
  permissions: { read: true, write: true },
  async fn() {
    const root = await Deno.makeTempDir({ prefix: "md-test-" });
    try {
      const a = path.join(root, "a.md");
      const bdir = path.join(root, "b");
      const bfile = path.join(bdir, "c.md");
      const priv = path.join(root, "_private.md");
      await makeFile(a, "Content A");
      await makeFile(bfile, "Content B");
      await makeFile(priv, "secret");

      const out = path.join(root, "out.txt");
      await md_files_to_txt({
        root,
        follow_symlinks: false,
        output_path: out,
        exclude_regexes: [],
        include_regexes: [],
        exclude_globs: [],
        include_globs: [],
      });

      const txt = await Deno.readTextFile(out);
      expect(txt).toContain("> [source](a.md)");
      expect(txt).toContain("Content A");
      expect(txt).toContain("> [source](b/c.md)");
      expect(txt).toContain("Content B");
      // private file should be excluded
      expect(txt).not.toContain("secret");
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test({
  name: "include and exclude regex behavior",
  permissions: { read: true, write: true },
  async fn() {
    const root = await Deno.makeTempDir({ prefix: "md-test-" });
    try {
      const keep = path.join(root, "keep.md");
      const skip = path.join(root, "skipme.md");
      await makeFile(keep, "keep content");
      await makeFile(skip, "skip content");

      const out = path.join(root, "out.txt");
      await md_files_to_txt({
        root,
        follow_symlinks: false,
        output_path: out,
        exclude_regexes: [],
        include_regexes: ["keep"],
        exclude_globs: [],
        include_globs: [],
      });

      const txt = await Deno.readTextFile(out);
      expect(txt).toContain("keep content");
      expect(txt).not.toContain("skip content");
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test({
  name: "glob include/exclude works",
  permissions: { read: true, write: true },
  async fn() {
    const root = await Deno.makeTempDir({ prefix: "md-test-" });
    try {
      const docs = path.join(root, "docs");
      const notes = path.join(root, "notes");
      await makeFile(path.join(docs, "readme.md"), "docs readme");
      await makeFile(path.join(notes, "other.md"), "notes other");

      const out = path.join(root, "out.txt");
      await md_files_to_txt({
        root,
        follow_symlinks: false,
        output_path: out,
        exclude_regexes: [],
        include_regexes: [],
        exclude_globs: ["**/other.md"],
        include_globs: ["docs/**"],
      });

      const txt = await Deno.readTextFile(out);
      expect(txt).toContain("docs readme");
      expect(txt).not.toContain("notes other");
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test({
  name: "symlink deduplication (skipped on Windows)",
  permissions: { read: true, write: true },
  async fn() {
    if (Deno.build.os === "windows") {
      return; // symlink creation requires elevated permissions on Windows in many setups
    }

    const root = await Deno.makeTempDir({ prefix: "md-test-" });
    try {
      const orig = path.join(root, "orig.md");
      const link = path.join(root, "link.md");
      await makeFile(orig, "original content");
      await Deno.symlink(orig, link);

      const out = path.join(root, "out.txt");
      await md_files_to_txt({
        root,
        follow_symlinks: true,
        output_path: out,
        exclude_regexes: [],
        include_regexes: [],
        exclude_globs: [],
        include_globs: [],
      });

      const txt = await Deno.readTextFile(out);
      // original content should appear once
      const occurrences = txt.split("original content").length - 1;
      expect(occurrences).toBe(1);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test({
  name: "respects max_depth",
  permissions: { read: true, write: true },
  async fn() {
    const root = await Deno.makeTempDir({ prefix: "md-test-" });
    try {
      // create nested a/b/c.md
      const deep = path.join(root, "a", "b", "c.md");
      await makeFile(deep, "deep content");

      const out = path.join(root, "out.txt");
      // set max_depth to 1 so nested file is ignored
      await md_files_to_txt({
        root,
        follow_symlinks: false,
        output_path: out,
        exclude_regexes: [],
        include_regexes: [],
        exclude_globs: [],
        include_globs: [],
        max_depth: 1,
      });

      const txt = await Deno.readTextFile(out);
      expect(txt).not.toContain("deep content");
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});
