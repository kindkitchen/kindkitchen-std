export function replace_content_between_markers(
    content: string,
    options: { marker_start: string; marker_end: string },
    insertion: string,
): string | null {
    const {
        marker_end,
        marker_start,
    } = options;

    const marker_start_position = content.indexOf(marker_start);

    if (marker_start_position === -1) {
        return null;
    }

    const next_after_marker_end_position = content.indexOf(
        marker_end,
        marker_start_position + marker_start.length,
    );

    if (next_after_marker_end_position === -1) {
        return null;
    }

    return [
        content.slice(0, marker_start_position).concat(marker_start),
        insertion,
        content.slice(next_after_marker_end_position),
    ].join("\n");
}
