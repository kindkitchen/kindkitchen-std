import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
} from "@std/assert";
import { Requirements } from "./requirements.local.gauth.ts";

Deno.test("Requirements.render_consent_screen", async (t) => {
  await t.step("injects state and redirect_uri into the form", () => {
    const html = Requirements.render_consent_screen({
      state: "state-abc",
      redirect_uri: "http://localhost:8000/callback",
    });

    assertStringIncludes(
      html,
      'action="http://localhost:8000/callback"',
    );
    assertStringIncludes(html, 'value="state-abc"');
    // redirect uri is also exposed as its own editable input
    assertStringIncludes(
      html,
      'id="redirect-uri"',
    );
  });

  await t.step("defaults state to a random uuid when omitted", () => {
    const a = Requirements.render_consent_screen({ redirect_uri: "/cb" });
    const b = Requirements.render_consent_screen();

    const uuid =
      /value="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/;
    assertMatch(a, uuid);
    assertMatch(b, uuid);

    const extract = (html: string) =>
      html.match(/id="state-input"[\s\S]*?value="([^"]+)"/)?.[1];
    assert(extract(a) !== extract(b), "each render gets a fresh uuid");
  });

  await t.step("renders without any args", () => {
    const html = Requirements.render_consent_screen();
    assert(html.trimStart().startsWith("<!DOCTYPE html>"));
    assertStringIncludes(html, 'action=""');
  });

  await t.step("ships a default editable callback code JSON", () => {
    const html = Requirements.render_consent_screen({
      state: "s",
      redirect_uri: "/cb",
    });

    assertStringIncludes(html, "jane@example.com");
    assertStringIncludes(html, "optional-refresh-token");
    assertStringIncludes(html, "<textarea");
  });

  await t.step("exposes form and json tabs that share the data", () => {
    const html = Requirements.render_consent_screen({ state: "s" });

    assertStringIncludes(html, 'data-tab="form"');
    assertStringIncludes(html, 'data-tab="json"');
    assertStringIncludes(html, 'id="form-root"');
    assertStringIncludes(html, 'id="code-json"');
    // form is the default active tab
    assertStringIncludes(html, 'class="tab active" data-tab="form"');
  });

  await t.step("leaves no template placeholders behind", () => {
    const html = Requirements.render_consent_screen({
      state: "s",
      redirect_uri: "/cb",
    });

    assert(!html.includes("__STATE__"));
    assert(!html.includes("__REDIRECT_URI__"));
    assert(!html.includes("__DEFAULT_CODE__"));
  });

  await t.step("escapes html in state and redirect_uri", () => {
    const html = Requirements.render_consent_screen({
      state: `"><script>alert(1)</script>`,
      redirect_uri: `/cb?a=1&b=2`,
    });

    assert(!html.includes("<script>alert(1)</script>"));
    assertStringIncludes(html, "&lt;script&gt;");
    assertStringIncludes(html, "&amp;b=2");
  });

  await t.step("produces a full html document", () => {
    const html = Requirements.render_consent_screen({
      state: "s",
      redirect_uri: "/cb",
    });

    assert(html.trimStart().startsWith("<!DOCTYPE html>"));
    assertStringIncludes(html, "<title>Mocked Google Consent Screen</title>");
    assertEquals(typeof html, "string");
  });
});
