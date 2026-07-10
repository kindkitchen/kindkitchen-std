import { FeatureTag } from "./feature-tag._place_some-feature_holder_.ts";
import { Interface } from "./interface._place_some-feature_holder_.ts";

export const _place_SomeFeature_holder_ = {
    Interface,
    FeatureTag,
    load_preset: async (variant: PresetVariant) => {
        if (variant === "_place_some-variant_holder_") {
            const { Preset, Requirements, Tag } = await import(
                "./preset-_place_some-variant_holder_/mod.ts"
            );

            return {
                Preset,
                Requirements,
                Tag,
            };
        }
    },
};

type PresetVariant = "_place_some-variant_holder_";
