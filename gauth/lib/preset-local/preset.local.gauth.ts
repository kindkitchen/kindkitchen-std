import { Effect, Layer } from "effect";
import { InvalidCallbackCodeError } from "../errors.gauth.ts";
import { Interface } from "../interface.gauth.ts";
import { Requirements } from "./requirements.local.gauth.ts";

const init_generate_sign_in_url = (
  { mocked_google_consent_screen_url, redirect_uri }: {
    mocked_google_consent_screen_url: string;
    redirect_uri: string;
  },
): Interface["Service"]["generate_sign_in_url"] =>
(payload) =>
  Effect.gen(function* () {
    return {
      authorization_url:
        `${mocked_google_consent_screen_url}?${new URLSearchParams({
          state: payload.state,
          scope: payload.scope.join(" "),
          redirect_uri,
        })}`,
      ctx: { code_verifier: "fake-code-verifier" },
    };
  });
const init_process_callback_payload =
  (): Interface["Service"]["process_callback_payload"] =>
  ({ code }) =>
  Effect.gen(function* () {
    const data = yield* Effect.try({
      try: () => JSON.parse(code),
      catch: (cause) => new InvalidCallbackCodeError({ cause }),
    });
    const id = crypto.randomUUID();

    return {
      access_token: `fake-access-token-${id}`,
      id_token: `fake-id-token-${id}`,
      ...data,
      user_info: {
        email: `${id}@fake.email`,
        name: `Fake User ${id}`,
        id: `fake-user-id-${id}`,
        ...data.user_info,
      },
    };
  });

export const Preset = Layer.effect(
  Interface,
  Effect.gen(function* () {
    const { REDIRECT_URI, MOCKED_GOOGLE_CONSENT_SCREEN_URL } =
      yield* Requirements;
    return {
      generate_sign_in_url: init_generate_sign_in_url(
        {
          mocked_google_consent_screen_url: MOCKED_GOOGLE_CONSENT_SCREEN_URL,
          redirect_uri: REDIRECT_URI,
        },
      ),
      process_callback_payload: init_process_callback_payload(),
    };
  }),
);
