import { expect } from "@std/expect";
import { Context, Effect, Layer, Result } from "effect";
import { assign, createActor, setup, toPromise } from "xstate";
import { promise_logic_from_effect } from "./src/lib/promise_logic_from_effect.ts";

class A extends Context.Service<A, { make_a: () => "a" | "A" }>()("A") {}
class B extends Context.Service<B, { make_b: () => "b" | "B" }>()("B") {}

const demo = (message: string) =>
    Effect.gen(function* () {
        const { make_a } = yield* A;
        const { make_b } = yield* B;
        const a = make_a();
        const b = make_b();
        const a_is_lower = a !== "A";
        const b_is_lower = b === "b";
        const is_same_case = a_is_lower === b_is_lower;

        if (!is_same_case) {
            throw new Error(
                "a & b services should be the same case!" as const,
            );
        }

        if (a.toLowerCase() !== "a") {
            yield* Effect.fail("unexpected value for letter 'a'");
        }

        if (b.toLowerCase() !== "b") {
            yield* Effect.fail("unexpected value for letter 'b'");
        }

        return {
            title: `${a}${b}:`,
            message: a_is_lower ? message.toLowerCase() : message.toUpperCase(),
        };
    });

const x = {
    INIT: {
        name: "Init",
        ref: "#Init",
    },
    OK: {
        name: "Ok",
        ref: "#Ok",
    },
    DONE: {
        name: "Done",
        ref: "#Done",
    },
    NOK: {
        name: "Nok",
        ref: "#Nok",
    },
    EXCEPTION: {
        name: "Exception",
        ref: "#Exception",
    },
    ERROR: {
        name: "Error",
        ref: "#Error",
    },
};
const machine = setup({
    actors: {
        demo: promise_logic_from_effect(demo),
    },
    guards: {
        is_demo_failed: (_, output: Result.Result<unknown, unknown>) => {
            const is = Result.isFailure(output);
            return is;
        },
    },
    actions: {
        assign_output: assign({ output: (_, value) => value }),
    },
    types: {
        context: {} as {
            A: Layer.Layer<A>;
            B: Layer.Layer<B>;
            output?: unknown;
        },
        input: {} as {
            deps: [Layer.Layer<A>, Layer.Layer<B>];
        },
        output: {} as { message: string },
    },
}).createMachine({
    context: ({ input }) => {
        return {
            A: input.deps[0],
            B: input.deps[1],
        };
    },
    output: ({ context }) => {
        if (typeof context.output === "string") {
            return { message: context.output };
        }

        return { message: "wtf?" };
    },
    initial: x.INIT.name,
    states: {
        [x.INIT.name]: {
            id: x.INIT.name,
            invoke: {
                src: "demo",
                input: ({ context }) => ({
                    args: ["hello world"],
                    layer: Layer.mergeAll(
                        context.A,
                        context.B,
                    ),
                }),
                onDone: [
                    {
                        guard: {
                            type: "is_demo_failed",
                            params: ({ event }) => event.output,
                        },
                        target: x.EXCEPTION.ref,
                    },
                    {
                        target: x.OK.ref,
                    },
                ],
                onError: {
                    target: x.ERROR.ref,
                },
            },
        },
        [x.OK.name]: {
            id: x.OK.name,
            always: {
                target: x.DONE.ref,
                actions: {
                    type: "assign_output",
                    params: "ok!",
                },
            },
        },
        [x.DONE.name]: {
            id: x.DONE.name,
            type: "final",
        },
        [x.NOK.name]: {
            id: x.NOK.name,
            onDone: { target: x.DONE.ref },
            initial: x.ERROR.name,
            states: {
                [x.EXCEPTION.name]: {
                    id: x.EXCEPTION.name,
                    always: { target: x.DONE.ref },
                    entry: {
                        type: "assign_output",
                        params: "oops!",
                    },
                },
                [x.ERROR.name]: {
                    id: x.ERROR.name,
                    always: { target: x.DONE.ref },
                    entry: {
                        type: "assign_output",
                        params: "how?",
                    },
                },
            },
        },
    },
});

Deno.test("promise_logic_from_effect", async (t) => {
    for (
        const { name, input, expected } of [
            {
                name: "all should be ok",
                input: {
                    deps: [
                        Layer.succeed(A, {
                            make_a: () => "a",
                        }),
                        Layer.succeed(B, {
                            make_b: () => "b",
                        }),
                    ] as const,
                },
                expected: "ok!",
            },
            {
                name:
                    "a & B, different cases should throw error (uncontrolled)",
                input: {
                    deps: [
                        Layer.succeed(A, {
                            make_a: () => "a",
                        }),
                        Layer.succeed(B, {
                            make_b: () => "B",
                        }),
                    ] as const,
                },
                expected: "how?",
            },
            {
                name:
                    "no 'a'/'A' value case should produce exception (controlled)",
                input: {
                    deps: [
                        Layer.succeed(A, {
                            make_a: () => "c" as unknown as "a", /// test purpose,
                        }),
                        Layer.succeed(B, {
                            make_b: () => "b",
                        }),
                    ] as const,
                },
                expected: "oops!",
            },
        ]
    ) {
        await t.step(`Scenario when ${name}`, async () => {
            const actor = createActor(machine, {
                input: {
                    deps: [
                        input.deps[0],
                        input.deps[1],
                    ],
                },
            });

            actor.start();
            await toPromise(actor);

            expect(actor.getSnapshot().output?.message).toBe(expected);
        });
    }
});
