import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertMatch,
} from "@std/assert";
import { Effect, Layer } from "effect";
import { GAuthErr } from "../errors.gauth.ts";
import { Interface } from "../interface.gauth.ts";
import { Preset } from "./preset.local.gauth.ts";
import { Requirements } from "./requirements.local.gauth.ts";

const REDIRECT_URI = "http://localhost:8000/callback";
const MOCKED_GOOGLE_CONSENT_SCREEN_URL = "http://localhost:8000/consent";

const RequirementsLayer = Layer.succeed(Requirements, {
  REDIRECT_URI,
  MOCKED_GOOGLE_CONSENT_SCREEN_URL,
});

const TestLayer = Preset.pipe(Layer.provide(RequirementsLayer));

const run = <A, E>(program: Effect.Effect<A, E, Interface>) =>
  Effect.runPromise(program.pipe(Effect.provide(TestLayer)));

const run_error = <A, E>(program: Effect.Effect<A, E, Interface>) =>
  Effect.runPromise(program.pipe(Effect.flip, Effect.provide(TestLayer)));

Deno.test("local preset: generate_sign_in_url", async (t) => {
  await t.step("points at the mocked consent screen url", async () => {
    const { authorization_url } = await run(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.generate_sign_in_url({
          scope: ["openid", "email", "profile"],
          state: "state-123",
        });
      }),
    );

    const url = new URL(authorization_url);
    assertEquals(
      `${url.origin}${url.pathname}`,
      MOCKED_GOOGLE_CONSENT_SCREEN_URL,
    );
  });

  await t.step("encodes state, scope and redirect_uri", async () => {
    const { authorization_url } = await run(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.generate_sign_in_url({
          scope: ["openid", "email", "profile", "https://extra/scope"],
          state: "csrf token & stuff",
        });
      }),
    );

    const params = new URL(authorization_url).searchParams;
    assertEquals(params.get("state"), "csrf token & stuff");
    assertEquals(
      params.get("scope"),
      "openid email profile https://extra/scope",
    );
    assertEquals(params.get("redirect_uri"), REDIRECT_URI);
  });

  await t.step("returns a stable fake code_verifier", async () => {
    const { ctx } = await run(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.generate_sign_in_url({
          scope: ["openid", "email", "profile"],
          state: "s",
        });
      }),
    );

    assertEquals(ctx.code_verifier, "fake-code-verifier");
  });
});

Deno.test("local preset: process_callback_payload", async (t) => {
  await t.step("synthesizes fake tokens and user info", async () => {
    const result = await run(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.process_callback_payload({
          code: JSON.stringify({}),
          code_verifier: "fake-code-verifier",
        });
      }),
    );

    assertMatch(result.access_token, /^fake-access-token-/);
    assertMatch(result.id_token, /^fake-id-token-/);
    assertMatch(result.user_info.id, /^fake-user-id-/);
    assertMatch(result.user_info.email, /@fake\.email$/);
    assert(typeof result.user_info.name === "string");
  });

  await t.step("lets the code JSON override defaults", async () => {
    const result = await run(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.process_callback_payload({
          code: JSON.stringify({
            refresh_token: "rt-1",
            user_info: {
              email: "jane@example.com",
              name: "Jane Doe",
              id: "user-1",
            },
          }),
          code_verifier: "fake-code-verifier",
        });
      }),
    );

    assertEquals(result.refresh_token, "rt-1");
    assertEquals(result.user_info.email, "jane@example.com");
    assertEquals(result.user_info.name, "Jane Doe");
    assertEquals(result.user_info.id, "user-1");
  });

  await t.step("generates unique ids per call", async () => {
    const make = () =>
      run(
        Effect.gen(function* () {
          const gauth = yield* Interface;
          return yield* gauth.process_callback_payload({
            code: JSON.stringify({}),
            code_verifier: "fake-code-verifier",
          });
        }),
      );

    const [a, b] = await Promise.all([make(), make()]);
    assert(a.user_info.id !== b.user_info.id);
    assert(a.access_token !== b.access_token);
  });

  await t.step("fails with GAuthErr on bad JSON", async () => {
    const error = await run_error(
      Effect.gen(function* () {
        const gauth = yield* Interface;
        return yield* gauth.process_callback_payload({
          code: "not-json",
          code_verifier: "fake-code-verifier",
        });
      }),
    );

    assertInstanceOf(error, GAuthErr);
    assertEquals(error.message, "invalid callback code");
  });
});
