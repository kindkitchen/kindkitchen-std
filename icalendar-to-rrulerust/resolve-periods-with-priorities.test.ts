import { expect } from "@std/expect";
import { resolve_periods_with_priorities } from "./mod.ts";

const window = { min_date: new Date(0), max_date: new Date(10) };
function period(id: string, from: number, to: number, priority = 100) {
  return { id, from: new Date(from), to: new Date(to), priority };
}

Deno.test("resolver preserves last-active tie default and supports first-active", () => {
  const a = period("a", 0, 10);
  const b = period("b", 0, 10);
  const default_result = resolve_periods_with_priorities([a, b], window);
  const explicit_last = resolve_periods_with_priorities([a, b], window, {
    tie_break: "last",
  });
  const first = resolve_periods_with_priorities([a, b], window, {
    tie_break: "first",
  });
  expect(default_result).toEqual(explicit_last);
  expect(default_result[0].winner).toBe(b);
  expect(default_result[0].conflicts).toEqual([a]);
  expect(first[0].winner).toBe(a);
  expect(first[0].conflicts).toEqual([b]);
});

Deno.test("tie policy follows activation order rather than input array order", () => {
  const late = period("late", 3, 9);
  const early = period("early", 0, 10);
  const first = resolve_periods_with_priorities([late, early], window, {
    tie_break: "first",
  });
  const last = resolve_periods_with_priorities([late, early], window);
  expect(first[1].winner).toBe(early);
  expect(last[1].winner).toBe(late);
});

Deno.test("higher priority wins under both policies with all metadata retained", () => {
  const low = period("low", -5, 15, 1);
  const high = { ...period("high", 3, 7, 2), metadata: { kind: "example" } };
  for (const tie_break of ["first", "last"] as const) {
    const result = resolve_periods_with_priorities([low, high], window, {
      tie_break,
    });
    expect(result.map((p) => [p.from, p.to, p.winner.id])).toEqual([
      [0, 3, "low"],
      [3, 7, "high"],
      [7, 10, "low"],
    ]);
    expect(result[1].winner).toBe(high);
    expect(result[1].conflicts).toEqual([low]);
  }
});

Deno.test("touching intervals do not overlap and uncovered segments are omitted", () => {
  const result = resolve_periods_with_priorities([
    period("a", 1, 3),
    period("b", 3, 5),
    period("c", 7, 9),
    period("empty", 8, 8),
    period("outside", 10, 12),
  ], window);
  expect(result.map((p) => [p.from, p.to, p.conflicts.length])).toEqual([
    [1, 3, 0],
    [3, 5, 0],
    [7, 9, 0],
  ]);
  expect(resolve_periods_with_priorities([], window)).toEqual([]);
});

Deno.test("resolver does not mutate inputs and exposes every active source", () => {
  const rules = [period("a", 0, 10), period("b", 0, 10), period("c", 0, 10)];
  const before = JSON.stringify(rules);
  const result = resolve_periods_with_priorities(rules, window);
  expect(new Set([result[0].winner, ...result[0].conflicts])).toEqual(
    new Set(rules),
  );
  expect(JSON.stringify(rules)).toBe(before);
});
