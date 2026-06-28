import { encodeBase64Url } from "@std/encoding/base64url";
import { Effect, Layer } from "effect";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { GAuthErr } from "../errors.gauth.ts";
import { Interface } from "../interface.gauth.ts";
import { Requirements } from "./requirements.original.gauth.ts";

export const Preset = Layer.effect(
  Interface,
  Effect.gen(function* () {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URIS } =
      yield* Requirements;
    const client = new OAuth2Client({
      client_secret: GOOGLE_CLIENT_SECRET,
      client_id: GOOGLE_CLIENT_ID,
      redirect_uris: REDIRECT_URIS,
    });

    const generateCodeChallenge = async (verifier: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return encodeBase64Url(new Uint8Array(hash));
    };

    const generateRandomString = () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return encodeBase64Url(array);
    };

    const generate_sign_in_url: Interface["Service"]["generate_sign_in_url"] = (
      { scope, state, redirect_uri },
    ) =>
      Effect.gen(function* () {
        const code_verifier = generateRandomString();
        const code_challenge = yield* Effect.promise(() =>
          generateCodeChallenge(code_verifier)
        );
        const authorization_url = client.generateAuthUrl({
          access_type: "offline",
          scope,
          code_challenge,
          code_challenge_method: CodeChallengeMethod.S256,
          state,
          redirect_uri: redirect_uri ?? REDIRECT_URIS[0],
        });

        return {
          authorization_url,
          ctx: { code_verifier },
        };
      });

    const process_callback_payload:
      Interface["Service"]["process_callback_payload"] = (
        { code, code_verifier },
      ) =>
        Effect.gen(function* () {
          const { tokens } = yield* Effect.tryPromise({
            try: () => client.getToken({ code, codeVerifier: code_verifier }),
            catch: (cause) =>
              new GAuthErr({
                message: "failed to exchange callback code for tokens",
                cause,
              }),
          });

          if (!tokens.id_token) {
            return yield* new GAuthErr({
              message: "missing id_token in response",
            });
          }

          const ticket = yield* Effect.tryPromise({
            try: () =>
              client.verifyIdToken({
                idToken: tokens.id_token!,
                audience: GOOGLE_CLIENT_ID,
              }),
            catch: (cause) =>
              new GAuthErr({ message: "failed to verify id_token", cause }),
          });

          const payload = ticket.getPayload();
          if (!payload) {
            return yield* new GAuthErr({
              message: "missing payload in id_token",
            });
          }

          return {
            access_token: tokens.access_token!,
            id_token: tokens.id_token!,
            refresh_token: tokens.refresh_token ?? null,
            user_info: {
              id: payload.sub!,
              email: payload.email!,
              name: payload.name ?? null,
              picture: payload.picture ?? null,
            },
          };
        });

    return {
      generate_sign_in_url,
      process_callback_payload,
    };
  }),
);
