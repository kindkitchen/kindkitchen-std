export function is_json_object(
    candidate: unknown,
): candidate is Record<string, unknown> {
    return candidate !== null && typeof candidate === "object" &&
        !Array.isArray(candidate);
}
