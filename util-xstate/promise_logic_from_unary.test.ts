import { expect } from "@std/expect";
import { createActor, toPromise } from "xstate";
import { promise_logic_from_unary } from "./src/lib/promise_logic_from_unary.ts";

Deno.test("promise_logic_from_unary", async (t) => {
    await t.step("resolves with the function's return value", async () => {
        const double = async (n: number) => n * 2;
        const actor = createActor(promise_logic_from_unary(double), {
            input: 21,
        });
        actor.start();
        const result = await toPromise(actor);
        expect(result).toBe(42);
    });

    await t.step("input is passed as single arg, not an array", async () => {
        const identity = async (x: { key: string }) => x.key;
        const actor = createActor(promise_logic_from_unary(identity), {
            input: { key: "value" },
        });
        actor.start();
        const result = await toPromise(actor);
        expect(result).toBe("value");
    });

    await t.step("rejects when function throws", async () => {
        const boom = async (_n: number) => {
            throw new Error("unary boom");
        };
        const actor = createActor(promise_logic_from_unary(boom), {
            input: 0,
        });
        actor.start();
        await expect(toPromise(actor)).rejects.toThrow("unary boom");
    });
});
