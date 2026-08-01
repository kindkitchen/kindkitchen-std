import { Context } from "effect";
import { FeatureTag } from "./feature-tag._place_some-feature_holder_.ts";

export class Interface extends Context.Service<
    Interface,
    {
        example: boolean;
        demo: () => string;
    }
>()(FeatureTag) {}
