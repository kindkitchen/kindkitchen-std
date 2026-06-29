import { Context, type Effect } from "effect";
import type { GAuthErr } from "./errors.gauth.ts";
import { FeatureTag } from "./feature-tag.gauth.ts";

export { Interface };

class Interface extends Context.Service<Interface, Contract>()(FeatureTag) {}

type Contract = {
  generate_sign_in_url: (input: {
    scope: ["openid", "email", "profile", ...string[]];
    /**
     * Opaque value placed into the authorization URL and echoed back to the
     * redirect URI by Google. The caller owns its meaning and is responsible
     * for verifying it on callback (e.g. CSRF protection). The lib does not
     * interpret it.
     */
    state: string;
    redirect_uri?: string;
  }) => Effect.Effect<{
    authorization_url: string;
    ctx: { code_verifier: string };
  }, unknown>;
  process_callback_payload: (input: {
    code: string;
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
  }, GAuthErr>;
};
