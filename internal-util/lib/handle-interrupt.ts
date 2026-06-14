import { Console, Effect } from "effect";

export const handle_interrupt = (something: unknown): Effect.Effect<void> => {
  const message = `Program was interrupted!\n${String(something)}`;

  return Console.error(message);
};
