const start = "start" as start;
const end = "end" as end;
const because_event: because_event = "because_event";
const because_segment: because_segment = "because_segment";

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
      console.log("a", res < 0 ? "<" : ">", "b");
      return res;
    }

    if (a.kind === start && b.kind === end) {
      console.log("a == b, but a-start < b-end");
      return 1;
    }

    if (a.kind === end && b.kind === start) {
      console.log("a == b, but a-end > b-start");
      return -1;
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
    let x_prev = x_min;
    let state = init_state(input, events);
    const push = (result_item: R) => results.push(result_item);

    for (const event of events) {
      const x_curr = event.x;
      if (x_curr > x_prev) {
        state = processing({
          active,
          invocation_reason: because_segment,
          push,
          state,
          x_from: x_prev,
          x_to: x_curr,
        });
      }

      if (event.kind === start) {
        active.add(event.item);
      } else {
        active.delete(event.item);
      }

      state = processing({
        invocation_reason: because_event,
        event,
        active,
        state,
        push,
      });
      x_prev = x_curr;
    }

    if (x_prev < x_max) {
      /// Process the gap between the last event and x_max
      state = processing({
        active,
        invocation_reason: because_segment,
        state,
        push,
        x_from: x_prev,
        x_to: x_max,
      });
    }

    return { results, state };
  };
};

type SweepLineOptions<T, S, R> = {
  /**
   * The function to get the x of the start of the item.
   */
  get_start_x: (item: T, index: number, items: T[]) => number;
  /**
   * The function to get the x of the end of the item.
   */
  get_end_x: (item: T, index: number, items: T[]) => number;
  /**
   * The function to get the initial state of the sweep-line algorithm.
   * It is called once at the beginning of the algorithm and can be used to set up any necessary data structures or initial values.
   */
  init_state: (items: T[], events: SweepLineEvent<T>[]) => S;
  /**
   * Your logic is lives here.
   * On each event processing, you can do whatever you want having
   * current event, the set of the active itmes at this moment, the global state (what is also whatever you want it to be)
   * and a function to push something to the array or resulted items
   */
  processing: (
    /**
     * The aggregated API of processing sweep-line event (or nearby events).
     */
    ctx:
      & (
        | {
          invocation_reason: because_segment;
          x_from: number;
          x_to: number;
        }
        | {
          /**
           * Current event
           */
          event: SweepLineEvent<T>;
          invocation_reason: because_event;
        }
      )
      & {
        /**
         * Collection of other items that are active at this moment
         */
        active: Set<T>;
        /**
         * It may be anything you want. The core abilities
         * of state - is that it is something global.
         * Good for aggregations etc.
         */
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
type because_event = "because_event";
/**
 * Possible reason when event start later then previous ended.
 */
type because_segment = "because_segment";

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
      const { active, invocation_reason, push, state } = ctx;

      push({
        invocation_reason,
        ...("event" in ctx && {
          x: ctx.event.x,
          kind: ctx.event.kind,
        }),
        ...("x_from" in ctx && {
          x_from: ctx.x_from,
          x_to: ctx.x_to,
        }),
        state,
        active: [...active],
      });

      return {
        max_depth: state.max_depth > active.size
          ? state.max_depth
          : active.size,
      };
    },
  });
  const result = sweep_line(input_json, [-Infinity, Infinity]);
  console.log("The result is");
  console.log(result);
}
