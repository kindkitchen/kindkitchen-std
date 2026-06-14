import { Data } from "effect";

export const make_fail = <
  T extends Record<string, unknown> = {
    message: string;
    expected?: string;
    actual?: string;
    details?: string;
  },
>(
  tag: string,
): any => Data.TaggedError(tag)<T>;
