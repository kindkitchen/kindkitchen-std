import * as Errors from "./errors.gauth.ts";
import { FeatureTag } from "./feature-tag.gauth.ts";
import { Interface } from "./interface.gauth.ts";

export * from "./errors.gauth.ts";

export const GAuth = {
  Interface,
  FeatureTag,
  Errors,
  load_preset: {
    async local() {
      const { Preset, Requirements, Tag } = await import(
        "./preset-local/mod.ts"
      );

      return {
        Preset,
        Requirements,
        Tag,
      };
    },
    async original() {
      const { Preset, Requirements, Tag } = await import(
        "./preset-original/mod.ts"
      );

      return {
        Preset,
        Requirements,
        Tag,
      };
    },
  },
};
