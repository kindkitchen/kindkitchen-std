import type { _place_SomeFeature_holder_Options } from "./_place_some-feature_holder_.types.ts";

/// template ignore start
// Scaffolding-only notes (stripped from generated output via the ignore markers):
// - File and directory names containing `_place_some-feature_holder_` are renamed.
// - Provide each casing variant as its own dictionary key:
//     some-feature -> the kebab-case name
//     SomeFeature  -> the PascalCase name
/// template ignore end

/**
 * Factory for the _place_some-feature_holder_ feature.
 */
export function create_place_SomeFeature_holder_(
    options: _place_SomeFeature_holder_Options,
) {
    return {
        name: "_place_some-feature_holder_" as const,
        label: options.label,
        enabled: options.enabled,
    };
}
