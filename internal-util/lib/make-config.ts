import { Effect, Schema } from "effect";
import { make_fail } from "./make-fail.ts";

export const ConfigError = make_fail<{ cause: unknown }>("ConfigError");
export type ConfigError = InstanceType<typeof ConfigError>;

export const make_config = <In, Out>(
  schema: Schema.Codec<Out, In>,
  source: unknown,
) =>
  Schema.decodeUnknownEffect(schema)(source).pipe(
    Effect.mapError((cause) => new ConfigError({ cause })),
  );
