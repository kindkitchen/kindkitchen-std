/**
 * Assume that the content is read result from some typescript file.
 * The strategy how to fine free safe place for new insertions.
 *
 * 1. After last imports
 * 2. Into the beginning
 * ---
 * Customize with explicit behavior
 */
export function insert_content_into_ts_file(
    fileContent: string,
    _options: Record<PropertyKey, never> = {},
    insertion: string,
): string {
    const lines = fileContent.split("\n");
    const line_with_last_import_start = lines.findLastIndex((l) =>
        l.startsWith("import ")
    );
    const appendContent = `\n\n${insertion}\n\n`;

    if (line_with_last_import_start === -1) {
        return appendContent + fileContent;
    }

    const line_with_last_import_end = lines
        .slice(
            line_with_last_import_start,
        )
        .concat()
        .reduce((acc, l, i, arr) => {
            if (l.includes('"') || l.includes("'")) {
                acc = i + line_with_last_import_start;
                arr.splice(0, Infinity);
            }
            return acc;
        }, -1);

    if (line_with_last_import_end === -1) {
        throw new Error("Unable to detect end of the import statement");
    }

    return [
        lines.splice(0, line_with_last_import_end + 1).join("\n"),
        appendContent,
        lines.join("\n"),
    ].join("");
}
