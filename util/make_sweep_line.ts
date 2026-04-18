function sweep_line<T, S>(options: SweepLineOptions<T, S>, items: T[], edges: {
  min: number;
  max: number;
}): S[] {
  if /// early return for nothing to process
  (items.length === 0) {
    return [];
  }

  const events = /// create events for all items
    items.reduce((acc, item) => {
      let start = options.get_start(item);
      let end = options.get_end(item);
      const id = options.make_event_id(item);
      if /// skip items with invalid time ranges
      (start > end) {
        console.warn(
          `Item with id ${id} has start time greater than end time. Skipping.`,
        );
        return acc;
      } else if /// skip items that are completely outside the edges

      (end < edges.min || start > edges.max) {
        console.warn(
          `Item with id ${id} is completely outside the edges. Skipping.`,
        );
        return acc;
      }

      /// add event to list
      acc.push({
        id,
        item,
        time: start,
        kind: "start",
      }, {
        id,
        item,
        time: end,
        kind: "end",
      });

      return acc;
    }, [] as SweepLineEvent<T>[]);

  if /// early return for no valid events
  (events.length === 0) {
    return [];
  }

  /// sort events
  events.sort(options.events_comparator);

  /**
   * Some assumptions that we can safely make according to side effects of the above code:
   * - No two events will have the same time and kind (start before end)
   * - All events are within the edges
   * - All items have valid time ranges (start <= end)
   * - <events> has at least one event
   */

  const active_items = new Map<string, T>();
  let state = options.init_state();
  const states: S[] = [];
  let last_time = edges.min;
  const processing_event /// function to process each event and update active items and states
   = (event: SweepLineEvent<T>) => {
    const current_time = event.time;

    if /// resolve state for the time range between last_time and current_time
    (current_time >= last_time) {
      state = options.resolve_state(active_items, state);
      states.push(state);
    }

    if (event.kind === "start") {
      active_items.set(event.id, event.item);
    } else {
      active_items.delete(event.id);
    }

    last_time = current_time;
  };

  /// process all events
  events.forEach(processing_event);

  return states;
}

export type SweepLineEvent<T> = {
  id: string;
  item: T;
  kind: "start" | "end";
  time: number;
};

export type SweepLineOptions<T, S> = {
  get_start: (item: T) => number;
  get_end: (item: T) => number;
  make_event_id: (item: T) => string;
  events_comparator: (a: SweepLineEvent<T>, b: SweepLineEvent<T>) => number;
  init_state: () => S;
  resolve_state: (active_items: Map<string, T>, state: S) => S;
};
