import { expect } from "@std/expect";
import { make_sweep_line } from "../make_sweep_line.ts";

Deno.test("empty input", () => {
  const sweep = make_sweep_line<any, {}, any>({
    get_start_x: () => 0,
    get_end_x: () => 0,
    init_state: () => ({}),
    processing: (ctx) => ctx.state,
  });

  const { results } = sweep([], [-Infinity, Infinity]);

  expect(results.length).toBe(0);
});
