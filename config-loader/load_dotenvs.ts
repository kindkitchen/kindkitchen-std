import { load } from "@std/dotenv";

/**
 * Dynamically load configuration from a sequence of dotenv files.
 *
 * Each entry in `options` points to a dotenv file. The files are loaded in
 * order and merged into a single config object using a **last-win** strategy:
 * keys from later files override keys from earlier ones.
 *
 * An entry can be either:
 * - a `string`: a static path to a dotenv file, or
 * - a function: receives the config accumulated **so far** and returns the
 *   path to the next file. This lets you recompute the next path based on the
 *   values consumed up to that point (e.g. pick an env-specific file from a
 *   `STAGE`/`NODE_ENV` value loaded by a previous file).
 *
 * @typeParam T - Shape of the resulting merged config. This is a caller-asserted
 * type: the returned object is cast to `T` and is not validated at runtime.
 *
 * @param options - Ordered list of dotenv sources (static paths or path resolvers).
 * @returns The merged config object.
 *
 * @example
 * ```ts
 * const config = await load_dotenvs<{ STAGE: string; API_URL: string }>([
 *   ".env",
 *   // path of the next file depends on STAGE loaded from ".env"
 *   (acc) => `.env.${acc.STAGE}`,
 * ]);
 * ```
 */
export async function load_dotenvs<T extends Partial<Record<string, string>>>(
  options: (
    | string
    | (<MiddleT extends Partial<Record<string, string>> = Partial<T>>(
      acc: MiddleT,
    ) => string)
  )[],
): Promise<T> {
  let acc = {};
  for (const o of options) {
    const envPath = typeof o === "function" ? o(acc) : o;
    acc = {
      ...acc,
      ...await load({ envPath, export: false }),
    };
  }

  return acc as T;
}
