import type { GenerateConstX } from "./generate_const_x_types.ts";
import { is_json_object } from "./util/is_json_object.ts";

export function validate_const_x(x: unknown): x is GenerateConstX.Output {
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
        .map((prop) => prop in x ? null : prop)
        .filter(Boolean);

    if (missing_props.length) {
        console.warn(`Missing props: ${missing_props.join()}`);

        return false;
    }

    const { state } = x as Record<keyof GenerateConstX.Input, unknown>;

    if (!is_json_object(state)) {
        console.warn("<state> property is not an object");

        return false;
    }

    if (!Object.values(state).every((value) => is_state_value(value))) {
        return false;
    }

    /// TODO

    return true;
}

function is_state_value(
    candidate: unknown,
): candidate is GenerateConstX.Output["state"][string] {
    if (!is_json_object(candidate)) {
        console.warn(
            "State property should be an object with state-nodes for each key",
        );
        return false;
    }
    type K = keyof GenerateConstX.Output["state"][string];
    const props = [
        "name",
        "ref",
        "description",
    ] satisfies K[];
    const fails = props.filter((p) => typeof candidate[p] !== "string");

    if (fails.length) {
        console.warn(`\
Each state should have string value for keys:
${props.join()}
But these keys has wrong type:
${fails.join()}`);

        return false;
    }

    return true;
}
