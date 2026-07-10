import { expect } from "@std/expect";
import { replace_content_between_markers } from "./replace_content_between_markers.ts";

Deno.test(replace_content_between_markers.name, async (t) => {
    await t.step("Should work", () => {
        const options = {
            marker_start: "/// start",
            marker_end: "/// end",
        };
        const content = `\
hello world

/// start
old content
/// end
`;
        const insertion = "new content";

        const expected = `\
hello world

/// start
${insertion}
/// end
`;
        const actual = replace_content_between_markers(
            content,
            options,
            insertion,
        );

        expect(actual).toBe(expected);
    });
    await t.step("Should work with same marker for start and end", () => {
        const options = {
            marker_start: "/// marker",
            marker_end: "/// marker",
        };
        const content = `\
hello world

/// marker
old content
/// marker
`;
        const insertion = "new content";

        const expected = `\
hello world

/// marker
${insertion}
/// marker
`;
        const actual = replace_content_between_markers(
            content,
            options,
            insertion,
        );

        expect(actual).toBe(expected);
    });
});
