import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { Requirements } from "./requirements.local.gauth.ts";

Deno.test("Requirements.render_consent_screen", async (t) => {
  await t.step("injects state and redirect_uri into the form", () => {
    const html = Requirements.render_consent_screen({
      state: "state-abc",
      redirect_uri: "http://localhost:8000/callback",
    });

    assertStringIncludes(
      html,
      '<form method="GET" action="http://localhost:8000/callback">',
    );
    assertStringIncludes(html, 'name="state" value="state-abc"');
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
