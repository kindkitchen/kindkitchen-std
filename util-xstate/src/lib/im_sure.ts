import type { Result } from "effect";
import type { AnyEventObject, DoneActorEvent } from "xstate";

export const im_sure = {
    event_with_either_output: (ev: AnyEventObject) =>
        ev as DoneActorEvent<Result.Result<unknown, unknown>>,
    get_output_right: <T>(ev: AnyEventObject) =>
        ((
            ev as DoneActorEvent<Result.Result<unknown, unknown>>
        ).output as { success: T }).success,
    get_output_left: <T>(ev: AnyEventObject) =>
        ((
            ev as DoneActorEvent<Result.Result<unknown, unknown>>
        ).output as { failure: T }).failure,
};
