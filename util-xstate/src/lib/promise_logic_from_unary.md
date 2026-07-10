# About `promise_logic_from_unary`

Sugar wrapper around xstate's `fromPromise` for **single-parameter** async
functions. The `input` value is passed to the function directly — no wrapping in
an array.

```ts
import { createActor, setup, toPromise } from "xstate";
import { promise_logic_from_unary } from "./promise_logic_from_unary.ts";

const fetchUser = async (id: number) => ({ id, name: "Alice" });

const machine = setup({
    actors: {
        fetchUser: promise_logic_from_unary(fetchUser),
    },
}).createMachine({
    initial: "Load",
    states: {
        Load: {
            invoke: {
                src: "fetchUser",
                input: 42 as Parameters<typeof fetchUser>[0],
                onDone: {
                    target: "Done",
                    actions: ({ event }) => console.log(event.output),
                },
            },
        },
        Done: { type: "final" },
    },
});

await toPromise(createActor(machine).start());
```

#### Key points

- `input` is the **single argument** value, not a tuple.
- For functions with multiple parameters use
  [`promise_logic_from_function`](./promise_logic_from_function.md) instead.
- Errors thrown by the function surface in `onError`.
