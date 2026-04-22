import {
  because_event,
  because_segment,
  make_sweep_line,
} from "@kindkitchen/std-sweep-line";

export function resolve_periods_with_priorities<T>(
  periods: (T & { from: Date; to: Date; priority: number })[],
  { min_date, max_date }: { min_date: Date; max_date: Date },
) {
  const sweep_line = make_sweep_line<typeof periods[number]>({
    get_start_x: (period) => period.from.getTime(),
    get_end_x: (period) => period.to.getTime(),
    init_state: () => undefined,
    processing: (ctx) => {
      if (ctx.invocation_reason !== because_segment) {
        return ctx.state;
      }

      if (ctx.active.size === 0) {
        return ctx.state;
      }

      const winner = [...ctx.active].reduce((a, b) =>
        a.priority > b.priority ? a : b
      );
      const conflicts = [...ctx.active.difference(new Set([winner]))];

      ctx.push({ from: ctx.x_from, to: ctx.x_to, winner, conflicts });
      return ctx.state;
    },
  });

  return sweep_line(
    periods,
    [min_date, max_date].map((date) => date.getTime()) as [number, number],
  );
}

if (typeof Deno !== "undefined" && import.meta.main) {
  const demo = resolve_periods_with_priorities(
    [
      {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-10"),
        priority: 1,
        demo: {
          name: "period1",
        },
      },
      {
        from: new Date("2024-01-02"),
        to: new Date("2024-01-05"),
        priority: 1,
        demo: { name: "period2" },
      },
      {
        from: new Date("2024-01-03"),
        to: new Date("2024-01-12"),
        priority: 2,
        demo: { name: "period3" },
      },
      {
        from: new Date("2024-01-05"),
        to: new Date("2024-01-15"),
        priority: 2,
        foo: "bar",
      },
      {
        from: new Date("2024-01-12"),
        to: new Date("2024-01-20"),
        priority: 1,
        ok: true,
      },
      {
        from: new Date("2024-01-04"),
        to: new Date("2024-01-05"),
        priority: 3,
        hello: "world",
      },
    ],
    { min_date: new Date("2024-01-01"), max_date: new Date("2024-01-31") },
  );

  console.debug(`${resolve_periods_with_priorities.name} function demo: `);
  console.debug(demo);
}
