import { Context, Effect } from "effect";
import type { ProcessCallbackPayloadError } from "./errors.gauth.ts";
import { FeatureTag } from "./feature-tag.gauth.ts";

export class Interface extends Context.Tag(FeatureTag)<Interface, {
  generate_sign_in_url: (input: {
    scope: ["openid", "email", "profile", ...string[]];
    redirect_uri?: string;
  }) => Effect.Effect<{
    authorization_url: string;
    ctx: { state: string; code_verifier: string };
  }, unknown>;
  process_callback_payload: (input: {
    code: string;
    state: string;
    code_verifier: string;
  }) => Effect.Effect<{
    access_token: string;
    id_token: string;
    refresh_token?: string | null;
    user_info: {
      id: string;
      email: string;
      name?: string | null;
      picture?: string | null;
    };
  }, ProcessCallbackPayloadError>;
}>() {}
