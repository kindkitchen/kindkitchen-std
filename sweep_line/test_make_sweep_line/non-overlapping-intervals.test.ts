import { because_segment, make_sweep_line } from "../make_sweep_line.ts";
import { expect } from "@std/expect";

Deno.test("non-overlapping intervals", () => {
  const input = [
    [1, 3],
    [5, 7],
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
          active: [...ctx.active],
        });
      }
      return ctx.state;
    },
  });

  const { results } = sweep(input, [-Infinity, Infinity]);

  expect(results).toEqual([
    { from: -Infinity, to: 1, active: [] },
    { from: 1, to: 3, active: [[1, 3]] },
    { from: 3, to: 5, active: [] },
    { from: 5, to: 7, active: [[5, 7]] },
    { from: 7, to: Infinity, active: [] },
  ]);
});
