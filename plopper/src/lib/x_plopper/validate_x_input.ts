import type { GenerateConstX } from "./generate_const_x_types.ts";
import { is_json_object } from "./util/is_json_object.ts";

export function validate_x_input(x: unknown): x is GenerateConstX.Input {
    if (!is_json_object(x)) {
        console.warn("Not an even an object");
        return false;
    }

    const missing_props = ([
        "state",
        "event",
        "guard",
        "action",
        "actor",
        "delay",
    ] satisfies (keyof GenerateConstX.Input)[])
        .map((prop) =>
            Array.isArray(x[prop]) &&
                x[prop].every((v) => typeof v === "string")
                ? null
                : prop
        )
        .filter(Boolean);

    if (missing_props.length) {
        console.warn(
            `These props should have value of type string[]:\n${missing_props.join()}`,
        );

        return false;
    }

    return true;
}
