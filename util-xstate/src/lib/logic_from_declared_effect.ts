import { Effect, type Result } from "effect";
import { fromPromise } from "xstate";

/**
 * - Expects explicit generic type declaration
 * - On practical - it is providing the context type
 * - The context type should have `Actor` property - the map
 * of the functions, that returns `Effect.Effect`
 *
 *  ---
 *
 * Example of typical usage:
 * ```ts
 * import { Effect } from "effect";
 * import { setup } from "xstate";
 * import { logic_from_declared_effect } from "./logic_from_declared_effect.ts";
 *
 * /// Define context with `Actor` effect actors map **declarations**
 * type Ctx = {
 *     Actor: {
 *         /// the name of the property will be used to select this actor
 *         build_message_from_array: (words: string[]) => Effect.Effect<
 *             { message: string }, /// Success
 *             { fail_reason: "Array is empty!" } /// Possible exception
 *         >;
 *     };
 * };
 *
 * const words = [
 *     "I",
 *     "hope",
 *     "the",
 *     "example",
 *     "is",
 *     "pretty",
 *     "illustrative",
 *     ":D",
 * ];
 * const machine = setup({
 *     /// as example, that it pretty handy to declare input, through
 *     /// which the implementation should be provided
 *     types: { context: {} as Ctx, input: {} as { Actor: Ctx["Actor"] } },
 *     actors: {
 *         example: logic_from_declared_effect<Ctx>("build_message_from_array"), /// explicit generic Ctx!
 *     },
 * }).createMachine({
 *     invoke: {
 *         src: "example",
 *         input: ({ context }) => [context, words],
 *     },
 *     /// So the main benefit - is that the implementation
 *     /// can be provided absolutely from outside!
 *     context: ({ input }) => ({ Actor: input.Actor }),
 * });
 *
 * ```
 */
export const logic_from_declared_effect = <
    Ctx extends {
        Actor: Record<
            string,
            (...params: any[]) => Effect.Effect<any, any, never>
        >;
    } = never,
>(name: keyof Ctx["Actor"]) => {
    type Name = typeof name;
    type Eff = ReturnType<Ctx["Actor"][Name]>;
    return fromPromise<
        Result.Result<
            Effect.Success<Eff>,
            Effect.Error<Eff>
        >,
        [Ctx, ...Parameters<Ctx["Actor"][Name]>]
    >(
        async ({ input: [{ Actor }, ...args] }) => {
            const effect = Actor[name as string](...args);

            const program = effect;

            const result = await program.pipe(
                Effect.result,
                Effect.runPromise,
            );

            return result;
        },
    );
};
