import { Console } from "effect";

export const handle_interrupt = (something: unknown) => {
  const message = `Program was interrupted!\n${String(something)}`;

  return Console.error(message);
};
