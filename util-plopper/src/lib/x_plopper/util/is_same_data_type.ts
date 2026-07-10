/**
 * @description
 * Detect is two parameters has the same data-type?
 * For objects it means same keys (not more/less) with same type of values.
 * Recursive.
 * Automatically check from both sides.
 */
export function is_same_data_type(
    a: unknown,
    b: unknown,
    options: {
        /**
         * @description TODO
         */
        arr_strategy?:
            | "exact_el_order"
            | "first_el_enough"
            | "empty_always_equal";
    } = {},
): boolean {
    const { arr_strategy = "first_el_enough" } = options;
    if (typeof a !== "object") {
        if (typeof a === typeof b) {
            return true;
        } else {
            return false;
        }
    }

    if (typeof b !== "object") {
        return false;
    }

    if (a === null) {
        return b === null;
    }

    if (b === null) {
        return false;
    }

    /**
     * Array comparison
     * - "exact_el_order"     - means nothing special (indexes as keys) so skip to standard flow
     * - "empty_always_equal" - means [] is [...]
     * - "first_el_enough"    - arr[0] === arr2[0]
     */
    if (Array.isArray(a)) {
        if (!Array.isArray(b)) {
            return false;
        }

        if (arr_strategy !== "exact_el_order") {
            if (arr_strategy === "empty_always_equal") {
                return a.length === 0 || b.length === 0;
            }

            /// so "first_el_enough" strategy
            return is_same_data_type(a[0], b[0]);
        }
    }

    const a_record = a as Record<string, unknown>;
    const b_record = b as Record<string, unknown>;
    const aKeys = Object.keys(a_record);
    const bKeys = Object.keys(b_record);

    for (const ak of aKeys) {
        if (!is_same_data_type(a_record[ak], b_record[ak])) {
            return false;
        }
    }

    for (const bk of bKeys) {
        if (!is_same_data_type(b_record[bk], a_record[bk])) {
            return false;
        }
    }

    return true;
}
