import { Context } from "effect";
import { FeatureTag } from "./feature-tag._place_some-feature_holder_.ts";

export class Interface extends Context.Tag(FeatureTag)<
    Interface,
    {
        example: boolean;
        demo: () => string;
    }
>() {}
