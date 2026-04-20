import { expect } from "@std/expect";
import { because_event, make_sweep_line } from "../make_sweep_line.ts";

Deno.test("touching intervals should NOT overlap (end before start)", () => {
  const input = [
    [1, 5],
    [5, 10],
  ] as [number, number][];

  const sweep = make_sweep_line<[number, number], {}, any>({
    get_start_x: ([s]) => s,
    get_end_x: ([, e]) => e,
    init_state: () => ({}),
    processing: (ctx) => {
      if (ctx.invocation_reason === because_event) {
        ctx.push({
          x: ctx.event.x,
          kind: ctx.event.kind,
          active: [...ctx.active],
        });
      }
      return ctx.state;
    },
  });

  const { results } = sweep(input, [-Infinity, Infinity]);

  const at5 = results.filter((r) => r.x === 5);

  // EXPECTED: no overlap
  expect(at5).toEqual([
    { x: 5, kind: "end", active: [] },
    { x: 5, kind: "start", active: [[5, 10]] },
  ]);
});
