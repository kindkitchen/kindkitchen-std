const start = "start" as start;
const end = "end" as end;
const because_of_event = "because_of_event" as because_of_event;
const gap_between_range_and_first_event_starts =
  "gap_between_range_and_first_event_starts" as gap_between_range_and_first_event_starts;
const gap_between_last_event_and_range_ends =
  "gap_between_last_event_and_range_ends" as gap_between_last_event_and_range_ends;
const gap_between_events = "gap_between_events" as gap_between_events;

const make_sweep_line = <T, S = unknown, R = unknown>(
  options: SweepLineOptions<T, S, R>,
): (
  input: T[],
  x_range: [x_min: number, x_max: number],
) => { state: S; results: R[] } => {
  const {
    get_start_x,
    get_end_x,
    init_state,
    processing,
    extra: { comparator_clarification = () => 0 } = {},
  } = options;
  const comparator = (a: SweepLineEvent<T>, b: SweepLineEvent<T>) => {
    const res = a.x - b.x;
    if (res !== 0) {
      return res;
    } else if (a.kind === start && b.kind === end) {
      return -1;
    } else if (a.kind === end && b.kind === start) {
      return 1;
    }

    return comparator_clarification(a, b);
  };

  return function sweeping(input, x_range) {
    const results = [] as R[];
    const [x_min, x_max] = x_range;

    if (x_min >= x_max) {
      console.warn(
        `Invalid x_range: x_min (${x_min}) must be less than x_max (${x_max})`,
      );
      return { results, state: options.init_state(input, []) };
    }

    const events = input
      .flatMap((item, i) => {
        const start_x = Math.max(get_start_x(item, i, input), x_min);
        const end_x = Math.min(get_end_x(item, i, input), x_max);

        if (start_x >= end_x) {
          // The item does not contribute to the result, so we can skip it.
          return [];
        }

        return [
          { kind: start, x: start_x, item },
          { kind: end, x: end_x, item },
        ];
      })
      .sort(comparator);

    const active = new Set<T>();
    let state = init_state(input, events);
    if (events.length > 0 && events[0].x > x_min) {
      /// Process the gap between x_min and the first event
      state = processing({
        invocation_reason: gap_between_range_and_first_event_starts,
        state,
        push: (result_item) => {
          results.push(result_item);
        },
        x_from: x_min,
        x_to: events[0].x,
      });
    }
    let x_prev = x_min;

    for (const event of events) {
      const x_curr = event.x;
      let invocation_reason = because_of_event as
        | because_of_event
        | gap_between_events;

      if (x_curr > x_prev && active.size === 0) {
        /// Process the gap between the last event and the current one
        invocation_reason = gap_between_events;
      }

      state = processing({
        invocation_reason,
        x_prev,
        event,
        active,
        state,
        push: (result_item) => {
          results.push(result_item);
        },
      });
      x_prev = x_curr;
      if (event.kind === start) {
        active.add(event.item);
      } else {
        active.delete(event.item);
      }
    }

    if (x_prev < x_max) {
      /// Process the gap between the last event and x_max
      state = processing({
        invocation_reason: gap_between_last_event_and_range_ends,
        state,
        push: (result_item) => {
          results.push(result_item);
        },
        x_from: x_prev,
        x_to: x_max,
      });
    }

    return { results, state };
  };
};

type SweepLineOptions<T, S, R> = {
  get_start_x: (item: T, index: number, items: T[]) => number;
  get_end_x: (item: T, index: number, items: T[]) => number;
  init_state: (items: T[], events: SweepLineEvent<T>[]) => S;
  /**
   * Your logic is lives here.
   * On each event processing, you can do whatever you want having
   * current event, the set of the active itmes at this moment, the global state (what is also whatever you want it to be)
   * and a function to push something to the array or resulted items
   */
  processing: (
    /**
     * The aggregated API of processing sweep-line event.
     */
    ctx:
      & (
        | {
          invocation_reason:
            | gap_between_range_and_first_event_starts
            | gap_between_last_event_and_range_ends;
          x_from: number;
          x_to: number;
        }
        | {
          invocation_reason: because_of_event | gap_between_events;
          /**
           * The x of the last (previous) event.
           */
          x_prev: number;
          /**
           * Current event
           */
          event: SweepLineEvent<T>;
          /**
           * Collection of other items that are active at this moment
           */
          active: Set<T>;
          /**
           * It may be anything you want. The core abilities
           * of state - is that it is something global.
           * Good for aggregations etc.
           */
        }
      )
      & {
        state: S;
        /**
         * Whatever you need as a resulted item you should push whenever you need to do this.
         */
        push: (result_item: R) => void;
      },
  ) => S;

  extra?: {
    /**
     * Them core logic to order events are simple:
     * - earliest first
     * - otherwise start before end
     * - otherwise they are equal OR clarify it here
     */
    comparator_clarification?: (
      a: SweepLineEvent<T>,
      b: SweepLineEvent<T>,
    ) => number;
  };
};
type SweepLineEvent<T> = {
  kind: start | end;
  x: number;
  item: T;
};

/**
 * The <start> kind of the sweep-line event
 */
type start = "start";
/**
 * The <end> kind of the sweep-line event
 */
type end = "end";
/**
 * The reason why the processing function was invoked.
 * Because of event - is the most common reason for some business logic reason.
 */
type because_of_event = "because_of_event";
/**
 * Possible single reason to handle gap between the range start and the first event.
 */
type gap_between_range_and_first_event_starts =
  "gap_between_range_and_first_event_starts";
/**
 * Possible single reason to handle gap between the last event and the range end.
 */
type gap_between_last_event_and_range_ends =
  "gap_between_last_event_and_range_ends";
/**
 * Possible reason when event start later then previous ended.
 */
type gap_between_events = "gap_between_events";

if (typeof Deno !== "undefined" && import.meta.main) {
  const [input_str] = Deno.args;
  const input_json = JSON.parse(input_str) as [number, number][];
  console.log("The program was invoked with");
  console.log(input_json);
  const sweep_line = make_sweep_line<[number, number], { max_depth: number }>({
    get_end_x: ([, end]) => end,
    get_start_x: ([start]) => start,
    init_state: () => ({ max_depth: 0 }),
    processing: (ctx) => {
      if (ctx.invocation_reason !== because_of_event) {
        return ctx.state;
      }
      const { invocation_reason, push, active, event, state, x_prev } = ctx;
      if (x_prev !== event.x) {
        push({ from: x_prev, to: event.x, invocation_reason });
      }
      return ctx.state.max_depth < active.size
        ? { max_depth: active.size }
        : ctx.state;
    },
  });
  const result = sweep_line(input_json, [-Infinity, Infinity]);
  console.log("The result is");
  console.log(result);
}
