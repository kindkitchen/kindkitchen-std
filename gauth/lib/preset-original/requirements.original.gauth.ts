import { Context } from "effect";
import { FeatureTag } from "../feature-tag.gauth.ts";

export const Tag = `${FeatureTag}/original-requirements` as const;

export class Requirements extends Context.Service<Requirements, {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  REDIRECT_URIS: string[];
  pop_state: (state: string) => Promise<string | null>;
}>()(Tag) {}
