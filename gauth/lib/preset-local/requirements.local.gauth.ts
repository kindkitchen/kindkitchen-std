import { Context } from "effect";
import { FeatureTag } from "../feature-tag.gauth.ts";
import { mocked_google_consent_screen_html } from "./mocked-google-consent-screen.local.gauth.ts";

export const Tag = `${FeatureTag}/local-requirements` as const;

export class Requirements extends Context.Service<Requirements, {
  REDIRECT_URI: string;
  MOCKED_GOOGLE_CONSENT_SCREEN_URL: string;
}>()(Tag) {
  static render_consent_screen(
    { state, redirect_uri }: { state?: string; redirect_uri?: string } = {},
  ): string {
    const default_code = JSON.stringify(
      {
        user_info: {
          email: "jane@example.com",
          name: "Jane Doe",
          picture: "https://example.com/avatar.png",
        },
        refresh_token: "optional-refresh-token",
      },
      null,
      2,
    );

    // State defaults to a random UUID; the page also lets the user edit it
    // (and falls back to a generated value client-side when left blank).
    const resolved_state = state ?? crypto.randomUUID();

    return mocked_google_consent_screen_html
      .replaceAll("__REDIRECT_URI__", escape_html(redirect_uri ?? ""))
      .replace("__STATE__", escape_html(resolved_state))
      .replace("__DEFAULT_CODE__", escape_html(default_code));
  }
}

const escape_html = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
