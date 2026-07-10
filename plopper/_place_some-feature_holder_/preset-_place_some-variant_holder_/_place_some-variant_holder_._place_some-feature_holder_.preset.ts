import { Effect, Layer } from "effect";
import { Interface } from "../interface._place_some-feature_holder_.ts";
import { Requirements } from "./_place_some-variant_holder_._place_some-feature_holder_.requirements.ts";

export const Preset = Layer.effect(
    Interface,
    Effect.gen(function* () {
        const requirements = yield* Requirements;

        return {
            demo: () =>
                `Hello, ${requirements.hello}! This is a demo of the _place_SomeFeatureInterface_holder_ interface with the _place_SomeVariant_holder_ preset.`,
            example: true,
        };
    }),
);
