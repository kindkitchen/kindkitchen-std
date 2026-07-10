import { expect } from "@std/expect";
import { is_same_data_type } from "./util/is_same_data_type.ts";
import { DEFAULT_CONFIG_JSON_EXAMPLE } from "./toml_config_type.ts";
import * as toml from "@std/toml";
import { join } from "@std/path";

const pwd = import.meta.dirname!;

Deno.test("Toml config should have correct type", async (t) => {
    await t.step(
        "Config data-type from toml should match declared",
        async () => {
            const actual_config = toml.parse(
                await Deno.readTextFile(
                    join(pwd, "default_config.toml"),
                ),
            );
            const expected_config = DEFAULT_CONFIG_JSON_EXAMPLE;
            console.log(actual_config);
            console.log();
            expect(
                is_same_data_type(
                    actual_config,
                    expected_config,
                ),
            ).toBe(true);
        },
    );
});
