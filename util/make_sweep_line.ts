type start = "start";
const start = "start" as start;
type end = "end";
const end = "end" as end;

const make_sweep_line = <T, S>(options: SweepLineOptions<T, S>) => {
  const comparator = options.comparator_clarification
    ? (a: SweepLineEvent<T>, b: SweepLineEvent<T>) => {
      const res = a.x - b.x;
      if (res !== 0) {
        return res;
      }
      if (a.kind === "start" && b.kind === "end") {
        return -1;
      }

      return options.comparator_clarification!(a, b);
    }
    : (a: SweepLineEvent<T>, b: SweepLineEvent<T>) => {
      const res = a.x - b.x;
      if (res !== 0) {
        return res;
      }
      if (a.kind === "start" && b.kind === "end") {
        return -1;
      }

      return 0;
    };

  return (input: T[], x_range: [x_min: number, x_max: number]) => {
    const [x_min, x_max] = x_range;
    const events = input.flatMap((item) => {
      const start_x = Math.max(options.get_start_x(item, 0, input), x_min);
      const end_x = Math.min(options.get_end_x(item, 0, input), x_max);
      return [
        { kind: start, x: start_x, item },
        { kind: end, x: end_x, item },
      ];
    }).sort(comparator);

    const status = new Set<T>();
    let x_last = null as null | number;
    let state = options.init_state();

    for (const event of events) {
      const x_curr = event.x;
      if (x_last && x_curr > x_last) {
      }
      if (event.kind === "start") {
      } else {
        status.delete(event.item);
      }
      x_last = x_curr;
    }
  };
};

if (import.meta.main) {
  const [input_str] = Deno.args;
  const input_json = JSON.parse(input_str) as [number, number][];
  console.log("The program was invoked with");
  console.log(input_json);
  const sweep_line = make_sweep_line<[number, number], {}>({
    get_end_x: ([, end]) => end,
    get_start_x: ([start]) => start,
    init_state: () => ({}),
    compute_state: () => {
      return {};
    },
  });
  const result = sweep_line(input_json, [-Infinity, Infinity]);
  console.log("The result is");
  console.log(result);
}

type SweepLineOptions<T, S> = {
  get_start_x: (item: T, index: number, items: T[]) => number;
  get_end_x: (item: T, index: number, items: T[]) => number;
  init_state: () => S;
  compute_state: (ev: SweepLineEvent<T>, prev_state: S) => S;
  copy_state?: (prev: S) => S;
  comparator_clarification?: (
    a: SweepLineEvent<T>,
    b: SweepLineEvent<T>,
  ) => number;
};
type SweepLineEvent<T> = {
  kind: start | end;
  x: number;
  item: T;
};
