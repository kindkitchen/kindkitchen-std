import { expect } from "@std/expect";
import { Result } from "effect";
import { im_sure } from "./src/lib/im_sure.ts";

const rightEvent = {
    type: "xstate.done.actor.test",
    output: Result.succeed("ok"),
    actorId: "test",
};

const leftEvent = {
    type: "xstate.done.actor.test",
    output: Result.fail("fail"),
    actorId: "test",
};

Deno.test("im_sure", async (t) => {
    await t.step("event_with_either_output casts and preserves output", () => {
        const casted = im_sure.event_with_either_output(rightEvent);
        expect(Result.isSuccess(casted.output)).toBe(true);
    });

    await t.step("get_output_right extracts the right value", () => {
        expect(im_sure.get_output_right<string>(rightEvent)).toBe("ok");
    });

    await t.step("get_output_left extracts the left value", () => {
        expect(im_sure.get_output_left<string>(leftEvent)).toBe("fail");
    });
});
