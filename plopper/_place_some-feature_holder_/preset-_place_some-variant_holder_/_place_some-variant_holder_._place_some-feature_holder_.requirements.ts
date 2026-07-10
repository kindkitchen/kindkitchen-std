import { Context } from "effect";
import { FeatureTag } from "../feature-tag._place_some-feature_holder_.ts";

export const Tag = `${FeatureTag}/_place_SomeVariant_holder_` as const;

export class Requirements extends Context.Tag(Tag)<
    Requirements,
    {
        hello: "world";
    }
>() {}
