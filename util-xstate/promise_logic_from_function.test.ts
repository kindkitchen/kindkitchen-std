import { expect } from "@std/expect";
import { createActor, toPromise } from "xstate";
import { promise_logic_from_function } from "./src/lib/promise_logic_from_function.ts";

Deno.test("promise_logic_from_function", async (t) => {
    await t.step("resolves with the function's return value", async () => {
        const fn = async (a: string, b: number) => `${a}-${b}`;
        const actor = createActor(promise_logic_from_function(fn), {
            input: ["hello", 42],
        });
        actor.start();
        const result = await toPromise(actor);
        expect(result).toBe("hello-42");
    });

    await t.step(
        "multi-param function spreads all args correctly",
        async () => {
            const add = async (x: number, y: number, z: number) => x + y + z;
            const actor = createActor(promise_logic_from_function(add), {
                input: [1, 2, 3],
            });
            actor.start();
            const result = await toPromise(actor);
            expect(result).toBe(6);
        },
    );

    await t.step("rejects when function throws", async () => {
        const boom = async (_x: string) => {
            throw new Error("boom");
        };
        const actor = createActor(promise_logic_from_function(boom), {
            input: ["x"],
        });
        actor.start();
        await expect(toPromise(actor)).rejects.toThrow("boom");
    });
});
