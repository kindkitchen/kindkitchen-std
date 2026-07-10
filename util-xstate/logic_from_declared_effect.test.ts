import { expect } from "@std/expect";
import { Effect, Result } from "effect";
import { createActor, toPromise } from "xstate";
import { logic_from_declared_effect } from "./src/lib/logic_from_declared_effect.ts";

type Ctx = {
    Actor: {
        greet: (name: string) => Effect.Effect<string, string>;
    };
};

const logic = logic_from_declared_effect<Ctx>("greet");

Deno.test("logic_from_declared_effect", async (t) => {
    await t.step("wraps success in Result.Success", async () => {
        const actor = createActor(logic, {
            input: [
                {
                    Actor: {
                        greet: (name) => Effect.succeed(`Hello, ${name}!`),
                    },
                },
                "world",
            ],
        });
        actor.start();
        const result = await toPromise(actor);
        expect(Result.isSuccess(result)).toBe(true);
        if (Result.isSuccess(result)) {
            expect(result.success).toBe("Hello, world!");
        }
    });

    await t.step("wraps controlled failure in Result.Failure", async () => {
        const actor = createActor(logic, {
            input: [
                {
                    Actor: {
                        greet: (_name) => Effect.fail("name is forbidden"),
                    },
                },
                "forbidden",
            ],
        });
        actor.start();
        const result = await toPromise(actor);
        expect(Result.isFailure(result)).toBe(true);
        if (Result.isFailure(result)) {
            expect(result.failure).toBe("name is forbidden");
        }
    });

    await t.step("panics (throws) go to onError — actor rejects", async () => {
        const actor = createActor(logic, {
            input: [
                {
                    Actor: {
                        greet: (_name) =>
                            Effect.sync(() => {
                                throw new Error("panic!");
                            }),
                    },
                },
                "boom",
            ],
        });
        actor.start();
        await expect(toPromise(actor)).rejects.toThrow();
    });
});
