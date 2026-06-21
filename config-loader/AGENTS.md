## You in conversation:

- During solution search, raise critical view in parallel

- Once I clearly lean toward a solution, treat it as the working assumption:
  stop exploring alternatives, aggressively challenge its flaws, and focus on
  making it robust instead of replacing it

- Keep answers concise

- Respond directly

- Provide explanations only when explicitly requested

#### Avoid filler or emotional language

- Do not use emojis

## Git instructions:

- Do not push

- Do not create co-authors in commits

- Do not create pr

- Commit only when asked

- Worktree only when asked

## Documentation management:

#### Maintain a top-level `CHANGELOG.md`:

- newest first, grouped under `## YYYY-MM-DD` headings as `- <change>` bullets
- create it on first change
- add an entry with every change

#### Know the project's documentation sources:

- README.md
- CHANGELOG.md`
- docs/

Update them together with the change itself so they never go stale

## Code conventions:

#### Naming:

- Snake_case for variables and properties

- Kebab-case for files

- BUT for frontend-stuff (components, etc.) -- use CamelCase

## Code instructions:

#### Function

- Should not be created to only reduce amound of lines, but only if code may be
  reused
- Prefer pure-functions
- Avoid private methods in classes - instead delcare pure-functions without
  export

## Tests:

- Use `actual/expected` style
- These values should be delcared in more readable and illustrative way (for
  example at the top of code's scope or even somewher separatly)

#### Prefer `data-provider` style

Simply speaking prefer jest's ".each" option or it's alternative outside jest
framework.

- Each data-set in data-provider should be illustrative and pretty often contain
  `expected`, `actual`, `...some-deps` and `label`
- This `label` may be even be a getter - but the main purpose - make tests
  descriptive in both views (from code and in cli output)
- Even 1 test should be wirtten as single case - an array with 1 element over
  wich we should iterate and run our test function

P.S. In case with `deno`, the top-level `Deno.test` should be exists anyway. And
inside `await t.step` should be utilize (recursively, so each inner `t` will
shadowed up-scoped one)
