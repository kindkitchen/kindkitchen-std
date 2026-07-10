const example = "example";
export const DEFAULT_CONFIG_JSON_EXAMPLE = {
    naming: {
        machine: {
            globs: [example],
            globs_to_exclude: [example],
            names: [],
        },
        x: {
            x: example,
            state: example,
            event: example,
        },
    },
    insertion_marker: {
        x: {
            start: example,
            end: example,
        },
    },
};

export type TomlConfig = typeof DEFAULT_CONFIG_JSON_EXAMPLE;
