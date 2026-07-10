import { insert_content_into_ts_file } from "./insert_content_into_ts_file.ts";
import { expect } from "@std/expect";

const VERBOSE = false;
const log = (...args: unknown[]) => {
    const [last] = args.splice(-1, 1);
    if (!VERBOSE) return last;
    args.length && args.forEach((a) => console.log(a));
    console.log(last);

    return last;
};
Deno.test(insert_content_into_ts_file.name, async (t) => {
    const insertion = "// hello world";

    await t.step("Should insert at the beginning", () => {
        const fileContent = "const x = 0;";
        const actual = insert_content_into_ts_file(fileContent, {}, insertion);
        const expected = `\


${insertion}

${fileContent}`;

        expect(log("actual:", actual)).toBe(log("expected:", expected));
    });

    await t.step("Should insert after last import statement", () => {
        const fileContent = `\
import x from "kindkitchen/x";
import y from "kindkitchen/y";
const space = x * y;`;
        const actual = insert_content_into_ts_file(fileContent, {}, insertion);
        const expected = `\
import x from "kindkitchen/x";
import y from "kindkitchen/y";

${insertion}

const space = x * y;`;

        expect(log("actual:", actual)).toBe(log("expected:", expected));
    });

    await t.step("Should correctly resolve multi-line import", () => {
        const fileContent = `\
import z from "kindkitchen/z";
import {
    x,
    y,
} "kindkitchen";
const volume = x * y * z;`;
        const actual = insert_content_into_ts_file(fileContent, {}, insertion);
        const expected = `\
import z from "kindkitchen/z";
import {
    x,
    y,
} "kindkitchen";

${insertion}

const volume = x * y * z;`;

        expect(log("actual:", actual)).toBe(log("expected:", expected));
    });

    await t.step("Should correctly insert content into empty string", () => {
        const fileContent = ``;
        const actual = insert_content_into_ts_file(fileContent, {}, insertion);
        const expected = `\


${insertion}

`;

        expect(log("actual:", actual)).toBe(log("expected:", expected));
    });
});
