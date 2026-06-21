import { Console, Effect } from "effect";

export const handle_interrupt = (something: unknown) =>
  Effect.gen(function* () {
    const message = `Program was interrupted!\n${String(something)}`;

    yield* Console.error(message);

    return something;
  });
