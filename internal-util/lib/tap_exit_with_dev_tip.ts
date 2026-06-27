import { Exit } from "effect";

export const tap_exit_with_dev_tip = <A, B>(
  exit: Exit.Exit<A, B>,
  info_log = console.info,
  error_log = console.error,
) => {
  if (Exit.isSuccess(exit)) {
    if (exit.value !== undefined) {
      info_log(exit.value);
    }

    return exit;
  }

  const tips = exit.cause
    .toString()
    .split("\n")
    .filter((line) => !line.includes("node_modules"))
    .join("\n\n");

  error_log(
    exit,
    tips && `\
      ---- TIPS ----
      ${tips}
      --------------`,
  );

  return exit;
};
