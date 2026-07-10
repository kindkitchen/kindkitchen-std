// deno-lint-ignore-file no-explicit-any require-await
import { fromPromise } from "xstate";

/**
 * Sugar wrapper around xstate's `fromPromise`.
 * The purpose -- simply pass function and
 * automatically infer it's params as `input`
 * during invocation in some state.
 *
 * _(all params become an array)_
 */
export function promise_logic_from_function<
    T extends (...arg: any[]) => Promise<any>,
>(fn: T) {
    return fromPromise<Awaited<ReturnType<T>>, Parameters<T>>(
        async ({ input }) => {
            return fn(...input);
        },
    );
}
