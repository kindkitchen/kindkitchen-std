import { expect } from "@std/expect";
import { because_segment, make_sweep_line } from "../make_sweep_line.ts";

Deno.test("overlapping intervals", () => {
  const input = [
    [1, 5],
    [3, 7],
  ] as [number, number][];

  const sweep = make_sweep_line<[number, number], {}, any>({
    get_start_x: ([s]) => s,
    get_end_x: ([, e]) => e,
    init_state: () => ({}),
    processing: (ctx) => {
      if (ctx.invocation_reason === because_segment) {
        ctx.push({
          from: ctx.x_from,
          to: ctx.x_to,
          activeCount: ctx.active.size,
        });
      }
      return ctx.state;
    },
  });

  const { results } = sweep(input, [-Infinity, Infinity]);

  expect(results).toEqual([
    { from: -Infinity, to: 1, activeCount: 0 },
    { from: 1, to: 3, activeCount: 1 },
    { from: 3, to: 5, activeCount: 2 }, // overlap
    { from: 5, to: 7, activeCount: 1 },
    { from: 7, to: Infinity, activeCount: 0 },
  ]);
});
