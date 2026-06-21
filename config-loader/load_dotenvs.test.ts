import { assertEquals } from "@std/assert";
import { load_dotenvs } from "./load_dotenvs.ts";

type Options = Parameters<typeof load_dotenvs>[0];
type Seen = Array<Record<string, string | undefined>>;

type Case = {
  label: string;
  files: Record<string, string>;
  options: (dir: string, seen: Seen) => Options;
  expected: Record<string, string>;
  expected_seen?: Seen;
};

const cases: Case[] = [
  {
    label: "loads a single dotenv file",
    files: { ".env": "A=1\nB=2\n" },
    options: (dir) => [`${dir}/.env`],
    expected: { A: "1", B: "2" },
  },
  {
    label: "merges multiple files with last-win strategy",
    files: {
      ".env": "A=1\nB=2\n",
      ".env.local": "B=overridden\nC=3\n",
    },
    options: (dir) => [`${dir}/.env`, `${dir}/.env.local`],
    expected: { A: "1", B: "overridden", C: "3" },
  },
  {
    label: "resolves next path from config consumed so far",
    files: {
      ".env": "STAGE=prod\n",
      ".env.prod": "API_URL=https://prod\n",
      ".env.dev": "API_URL=https://dev\n",
    },
    options: (dir) => [`${dir}/.env`, (acc) => `${dir}/.env.${acc.STAGE}`],
    expected: { STAGE: "prod", API_URL: "https://prod" },
  },
  {
    label: "later dynamic file overrides earlier values",
    files: {
      ".env": "STAGE=prod\nX=base\n",
      ".env.prod": "X=prod\n",
    },
    options: (dir) => [`${dir}/.env`, (acc) => `${dir}/.env.${acc.STAGE}`],
    expected: { STAGE: "prod", X: "prod" },
  },
  {
    label: "returns empty object for empty options",
    files: {},
    options: () => [],
    expected: {},
  },
  {
    label: "dynamic resolver sees keys from all prior files",
    files: {
      ".env": "A=1\n",
      ".env.b": "B=2\n",
      ".env.1-2": "OK=yes\n",
    },
    options: (dir, seen) => [
      `${dir}/.env`,
      (acc) => {
        seen.push({ ...acc });
        return `${dir}/.env.b`;
      },
      (acc) => {
        seen.push({ ...acc });
        return `${dir}/.env.${acc.A}-${acc.B}`;
      },
    ],
    expected: { A: "1", B: "2", OK: "yes" },
    expected_seen: [{ A: "1" }, { A: "1", B: "2" }],
  },
];

Deno.test("load_dotenvs", async (t) => {
  for (const { label, files, options, expected, expected_seen } of cases) {
    await t.step(label, async (t) => {
      const dir = await Deno.makeTempDir();
      const seen: Seen = [];
      try {
        for (const [name, content] of Object.entries(files)) {
          await Deno.writeTextFile(`${dir}/${name}`, content);
        }

        const actual = await load_dotenvs(options(dir, seen));

        await t.step("merged config", () => assertEquals(actual, expected));
        if (expected_seen) {
          await t.step(
            "resolver accumulators",
            () => assertEquals(seen, expected_seen),
          );
        }
      } finally {
        await Deno.remove(dir, { recursive: true });
      }
    });
  }
});
