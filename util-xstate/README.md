# @kindkitchen/util-xstate

Utility library for integrating [XState](https://xstate.js.org/) with
[Effect](https://effect.website/) and Promise-based actors. Provides type-safe
helpers and conventions for building state machines with proper error handling.

## Purpose

This library bridges **XState** (state management) and **Effect** (functional
error handling), offering:

- **Effect-to-XState integration**: Transform Effect computations into XState
  actor logic with proper `Result`-typed outputs (success/failure)
- **Promise actor helpers**: Simplified wrappers around XState's `fromPromise`
  for cleaner async function integration
- **Guard utilities**: Type predicates for working with `Result` types in state
  transitions
- **Type-safe patterns**: Conventions and helpers that enforce type safety
  without runtime overhead

## Modules

### Promise & Effect Actors

- **[`promise-logic-from-unary`](./src/lib/promise_logic_from_unary.md)** —
  Wrapper for single-parameter async functions
- **[`promise-logic-from-function`](./src/lib/promise_logic_from_function.md)**
  — Wrapper for multi-parameter async functions (tuple input)
- **[`promise-logic-from-effect`](./src/lib/promise_logic_from_effect.md)** —
  Transform Effect computations into actor logic
- **[`logic-from-declared-effect`](./src/lib/logic_from_declared_effect.md)** —
  Opinionated abstraction for Effect actors with context conventions

### Guards for Result Types

- **[`guard-is-output-left`](./src/lib/guard_is_output_left.md)** — Check if
  output is `Result.Failure` (controlled failure)
- **[`guard-is-output-right`](./src/lib/guard_is_output_right.md)** — Check if
  output is `Result.Success` (success)

### Type Helpers

- **[`im-sure`](./src/lib/im_sure.md)** — Semantic helpers that enforce
  conventions without runtime checks. Use when you're confident about type
  assertions following declared patterns.

## Quick Start

```ts
import { createActor, setup, toPromise } from "xstate";
import { promise_logic_from_unary } from "@kindkitchen/util-xstate/promise-logic-from-unary";

const fetchData = async (id: number) => ({ id, data: "example" });

const machine = setup({
    actors: {
        fetch: promise_logic_from_unary(fetchData),
    },
}).createMachine({
    initial: "Loading",
    states: {
        Loading: {
            invoke: {
                src: "fetch",
                input: 42,
                onDone: {
                    target: "Done",
                    actions: ({ event }) => console.log(event.output),
                },
                onError: { target: "Error" },
            },
        },
        Done: { type: "final" },
        Error: { type: "final" },
    },
});

await toPromise(createActor(machine).start());
```

See the markdown files in `./src/lib/` for detailed documentation on each
module.
