import { Console, Effect, Exit } from "effect";

export const handle_exit = <S, E>(exit: Exit.Exit<S, E>) =>
  Effect.gen(function* () {
    if (Exit.isSuccess(exit)) {
      if (exit.value !== undefined) {
        yield* Console.info(exit.value);
      }

      return exit;
    }

    const tips = exit.cause
      .toString()
      .split("\n")
      .filter((line) => !line.includes("node_modules"))
      .join("\n\n");

    yield* Console.error(
      exit,
      tips && `\
      ---- TIPS ----
      ${tips}
      --------------`,
    );

    return exit;
  });
