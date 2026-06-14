import { Effect, Schema } from "effect";
import { make_fail } from "./make-fail.ts";

export const ConfigError: any = make_fail<{ cause: unknown }>("ConfigError");
export type ConfigError = InstanceType<typeof ConfigError>;

export const make_config = <In, Out>(
  schema: Schema.Schema<Out, In>,
  source: unknown,
): Effect.Effect<Out, InstanceType<typeof ConfigError>> =>
  Schema.decodeUnknown(schema)(source).pipe(
    Effect.mapError((cause) => new ConfigError({ cause })),
  );
