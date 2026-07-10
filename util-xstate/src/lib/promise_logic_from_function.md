# About `promise_logic_from_function`

Sugar wrapper around xstate's `fromPromise`. Pass a multi-parameter async
function and get back actor logic whose `input` is the parameter tuple.

```ts
import { createActor, setup, toPromise } from "xstate";
import { promise_logic_from_function } from "./promise_logic_from_function.ts";

const greet = async (name: string, loud: boolean) =>
    loud ? `HELLO, ${name.toUpperCase()}!` : `Hello, ${name}!`;

const machine = setup({
    actors: {
        greet: promise_logic_from_function(greet),
    },
}).createMachine({
    initial: "Run",
    states: {
        Run: {
            invoke: {
                src: "greet",
                input: ["world", true] as Parameters<typeof greet>,
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

- `input` is always a **tuple** matching the function's parameter list.
- Errors thrown by the function surface in `onError`.
- For a single-parameter function prefer
  [`promise_logic_from_unary`](./promise_logic_from_unary.md) — its `input` is
  the value directly, not a one-element array.
