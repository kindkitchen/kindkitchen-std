import { Effect, Layer } from "effect";
import {
  InvalidCallbackCodeError,
  StateNotFoundError,
} from "../errors.gauth.ts";
import { Interface } from "../interface.gauth.ts";
import { Requirements } from "./requirements.local.gauth.ts";

const init_generate_sign_in_url = (
  { mocked_google_consent_screen_url, redirect_uri }: {
    mocked_google_consent_screen_url: string;
    redirect_uri: string;
  },
): Interface["Type"]["generate_sign_in_url"] =>
(payload) =>
  Effect.gen(function* () {
    const state = crypto.randomUUID();
    return {
      authorization_url:
        `${mocked_google_consent_screen_url}?${new URLSearchParams({
          state,
          scope: payload.scope.join(" "),
          redirect_uri,
        })}`,
      ctx: { code_verifier: "fake-code-verifier", state },
    };
  });
const init_process_callback_payload = (
  pop_state: Requirements["Type"]["pop_state"],
): Interface["Type"]["process_callback_payload"] =>
({ state, code }) =>
  Effect.gen(function* () {
    const ok = yield* Effect.promise(() => pop_state(state));
    if (!ok) {
      return yield* new StateNotFoundError({ state });
    }
    const data = yield* Effect.try({
      try: () => JSON.parse(code),
      catch: (cause) => new InvalidCallbackCodeError({ cause }),
    });

    return {
      access_token: `fake-access-token-${state}`,
      id_token: `fake-id-token-${state}`,
      ...data,
      user_info: {
        email: `${state}@fake.email`,
        name: `Fake User ${state}`,
        id: `fake-user-id-${state}`,
        ...data.user_info,
      },
    };
  });

export const Preset = Layer.effect(
  Interface,
  Effect.gen(function* () {
    const { REDIRECT_URI, MOCKED_GOOGLE_CONSENT_SCREEN_URL, pop_state } =
      yield* Requirements;
    return {
      generate_sign_in_url: init_generate_sign_in_url(
        {
          mocked_google_consent_screen_url: MOCKED_GOOGLE_CONSENT_SCREEN_URL,
          redirect_uri: REDIRECT_URI,
        },
      ),
      process_callback_payload: init_process_callback_payload(pop_state),
    };
  }),
);
