import { Console, Effect, Exit } from "effect";

export const handle_exit = <S, E>(exit: Exit.Exit<S, E>): Effect.Effect<void> => {
  if (Exit.isSuccess(exit)) {
    if (exit.value !== undefined) {
      return Console.info(exit.value);
    }

    return Effect.void;
  }

  const tips = `
---- TIPS ----
${
    exit.cause
      .toString()
      .split("\n")
      .filter((line) => !line.includes("node_modules"))
      .join("\n\n")
  }
--------------
    
`;

  return Console.error(exit, tips);
};
