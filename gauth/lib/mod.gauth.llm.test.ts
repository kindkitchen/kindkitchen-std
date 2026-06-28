import { assert, assertEquals } from "@std/assert";
import { GAuth } from "./mod.gauth.ts";
import { FeatureTag } from "./feature-tag.gauth.ts";
import { Interface } from "./interface.gauth.ts";

Deno.test("GAuth surface", async (t) => {
  await t.step("re-exports the feature tag and interface", () => {
    assertEquals(GAuth.FeatureTag, FeatureTag);
    assertEquals(GAuth.Interface, Interface);
  });

  await t.step("exposes the error constructor", () => {
    assert(typeof GAuth.Errors.GAuthErr === "function");
  });

  await t.step("lazily loads the local preset", async () => {
    const local = await GAuth.load_preset.local();
    assert(local.Preset);
    assert(local.Requirements);
    assert(typeof local.Requirements.render_consent_screen === "function");
    assertEquals(local.Tag, `${FeatureTag}/local-requirements`);
  });

  await t.step("lazily loads the original preset", async () => {
    const original = await GAuth.load_preset.original();
    assert(original.Preset);
    assert(original.Requirements);
    assertEquals(original.Tag, `${FeatureTag}/original-requirements`);
  });
});
