import { expect } from "@std/expect";
import { because_segment, make_sweep_line } from "../make_sweep_line.ts";

Deno.test("range clipping", () => {
  const input = [[0, 10]] as [number, number][];

  const sweep = make_sweep_line<[number, number], {}, any>({
    get_start_x: ([s]) => s,
    get_end_x: ([, e]) => e,
    init_state: () => ({}),
    processing: (ctx) => {
      if (ctx.invocation_reason === because_segment) {
        ctx.push({
          from: ctx.x_from,
          to: ctx.x_to,
        });
      }
      return ctx.state;
    },
  });

  const { results } = sweep(input, [3, 7]);

  expect(results).toEqual([{ from: 3, to: 7 }]);
});
