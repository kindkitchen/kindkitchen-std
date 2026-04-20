import { make_sweep_line } from "../make_sweep_line.ts";

Deno.test("custom result", async () => {
  type Item = {
    from: Date;
    to: Date;
    priority: number;
  };
  type Result = {
    x: Date;
    kind: "from" | "to";
    priority: number;
  };
  const sweep_line = make_sweep_line<Item, null | Item, Result>({
    get_start_x: ({ from }) => from.getTime(),
    get_end_x: ({ to }) => to.getTime(),
    init_state: () => null as null | Item,
    processing: (ctx) => {
      const prev = ctx.state;
      const winner = [...ctx.active].reduce(
        (acc, item) => {
          if (!acc || acc.priority < item.priority) {
            acc = item;
          }

          return acc;
        },
        null as Item | null,
      );

      if (!prev && winner) {
        ctx.push({
          kind: "from",
          priority: winner.priority,
          x: winner.from,
        });

        return winner;
      }

      if (prev && winner && prev !== winner) {
        if (prev.priority < winner.priority) {
          ctx.push({
            kind: "to",
            priority: prev.priority,
            x: winner.from > prev.to ? prev.to : winner.from,
          });
          ctx.push({
            kind: "from",
            priority: winner.priority,
            x: winner.from,
          });
          return winner;
        }
      }

      return prev || winner;
    },
  });

  const actual = sweep_line(
    [
      {
        from: new Date("2024-01-01T00:00:00Z"),
        to: new Date("2024-01-01T02:00:00Z"),
        priority: 1,
      },
      {
        from: new Date("2024-01-01T01:00:00Z"),
        to: new Date("2024-01-01T03:00:00Z"),
        priority: 2,
      },
      {
        from: new Date("2024-01-01T02:30:00Z"),
        to: new Date("2024-01-01T04:00:00Z"),
        priority: 1,
      },
    ],
    [-Infinity, Infinity],
  );

  console.log(actual);
});
