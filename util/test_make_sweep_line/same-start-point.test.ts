import { expect } from "@std/expect";
import { because_event, make_sweep_line } from "../make_sweep_line.ts";

Deno.test("same start point", () => {
  const input = [
    [1, 5],
    [1, 10],
  ] as [number, number][];

  const sweep = make_sweep_line<[number, number], {}, any>({
    get_start_x: ([s]) => s,
    get_end_x: ([, e]) => e,
    init_state: () => ({}),
    processing: (ctx) => {
      if (ctx.invocation_reason === because_event) {
        ctx.push({
          x: ctx.event.x,
          active: [...ctx.active],
        });
      }
      return ctx.state;
    },
  });

  const { results } = sweep(input, [-Infinity, Infinity]);

  const at1 = results.filter((r) => r.x === 1);

  expect(at1.length).toBe(2);
  expect(at1[1].active.length).toBe(2);
});
