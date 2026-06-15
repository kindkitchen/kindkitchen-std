import { assert, assertEquals, assertThrows } from "@std/assert";
import { SubnameHelper } from "./subname-helper.ts";

Deno.test("SubnameHelper.parse: splits name and clarifications", () => {
  const subname = SubnameHelper.parse("allow.hostname");

  assertEquals(subname.name, "allow");
  assertEquals(subname.clarifications, ["hostname"]);
  assertEquals(subname.parts, ["allow", "hostname"]);
});

Deno.test("SubnameHelper.parse: rejects empty parts", () => {
  assertThrows(() => SubnameHelper.parse("dev..local"));
});

Deno.test("SubnameHelper.match: supports segment wildcards", () => {
  assert(SubnameHelper.match("allow.hostname", "allow.*"));
  assert(SubnameHelper.match("allow.hostname.endpoint", "allow.**"));
  assert(!SubnameHelper.match("allow.hostname.endpoint", "allow.*"));
});
