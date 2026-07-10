import { expect } from "@std/expect";
import { Result } from "effect";
import { is_output_left } from "./src/lib/guard_is_output_left.ts";

Deno.test("is_output_left", async (t) => {
    await t.step("returns true when output is Failure", () => {
        const event = {
            type: "xstate.done.actor.test",
            output: Result.fail("controlled failure"),
        };
        expect(is_output_left({ event })).toBe(true);
    });

    await t.step("returns false when output is Success", () => {
        const event = {
            type: "xstate.done.actor.test",
            output: Result.succeed("success"),
        };
        expect(is_output_left({ event })).toBe(false);
    });
});
