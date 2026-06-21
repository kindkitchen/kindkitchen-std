# Changelog

## 2026-06-20

- Add JSDoc to `load_dotenvs` describing dynamic dotenv loading, the dynamic
  path resolver, and the last-win merge strategy.
- Add `README.md` documenting `load_dotenvs`.
- Add `load_dotenvs.test.ts` covering merge, last-win, and dynamic path
  resolution; add `@std/assert` dependency.
