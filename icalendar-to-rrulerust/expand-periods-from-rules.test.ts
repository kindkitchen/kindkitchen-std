import { Temporal } from "@js-temporal/polyfill";
import { expect } from "@std/expect";
import {
  type CalendarPeriodRule,
  expand_periods_from_rules,
  type PeriodWindow,
} from "./mod.ts";

function instant(local: string, time_zone = "Europe/Kyiv"): Date {
  return new Date(
    Temporal.PlainDateTime.from(local).toZonedDateTime(time_zone)
      .epochMilliseconds,
  );
}

function seed(
  from: string,
  to: string,
  recurrence_rule = "FREQ=DAILY",
  time_zone = "Europe/Kyiv",
): CalendarPeriodRule {
  return {
    start_date: instant(from, time_zone),
    end_date: instant(to, time_zone),
    recurrence_rule,
    time_zone,
  };
}

function window(from: string, to: string): PeriodWindow {
  return { min_date: instant(from), max_date: instant(to) };
}

function local_string(value: Date, time_zone = "Europe/Kyiv"): string {
  return Temporal.Instant.fromEpochMilliseconds(value.getTime())
    .toZonedDateTimeISO(time_zone).toPlainDateTime().toString();
}

Deno.test("summer 09:00–18:00 stays local 09:00–18:00 in November", () => {
  const periods = expand_periods_from_rules([
    seed("2026-07-01T09:00", "2026-07-01T18:00"),
  ], window("2026-11-01T00:00", "2026-11-03T00:00"));
  expect(periods.map(({ from, to }) => [from.toISOString(), to.toISOString()]))
    .toEqual([
      ["2026-11-01T07:00:00.000Z", "2026-11-01T16:00:00.000Z"],
      ["2026-11-02T07:00:00.000Z", "2026-11-02T16:00:00.000Z"],
    ]);
});

for (
  const [name, from, to, expected_hours] of [
    ["spring", "2026-03-28T00:00", "2026-03-31T00:00", [24, 23, 24]],
    ["autumn", "2026-10-24T00:00", "2026-10-27T00:00", [24, 25, 24]],
  ] as const
) {
  Deno.test(`${name}: all-day recurrence follows local midnight`, () => {
    const periods = expand_periods_from_rules([
      seed("2026-01-01T00:00", "2026-01-02T00:00"),
    ], window(from, to));
    expect(periods.map((p) => (p.to.getTime() - p.from.getTime()) / 3600000))
      .toEqual(expected_hours);
    for (const period of periods) {
      expect(local_string(period.from).slice(-8)).toBe("00:00:00");
      expect(local_string(period.to).slice(-8)).toBe("00:00:00");
    }
    expect(periods[0].from).toEqual(instant(from));
    expect(periods.at(-1)!.to).toEqual(instant(to));
  });
}

Deno.test("overnight start before the query is included and clipped", () => {
  const rule = seed("2026-07-01T22:00", "2026-07-02T06:00");
  const periods = expand_periods_from_rules(
    [rule],
    window(
      "2026-10-25T00:00",
      "2026-10-25T07:00",
    ),
  );
  expect(periods).toHaveLength(1);
  expect(periods[0].from.toISOString()).toBe("2026-10-24T21:00:00.000Z");
  expect(periods[0].to.toISOString()).toBe("2026-10-25T04:00:00.000Z");
  expect(periods[0].rule).toBe(rule);
});

Deno.test("multi-day occurrences overlap a later window after COUNT is exhausted", () => {
  const periods = expand_periods_from_rules([
    seed("2026-10-20T22:00", "2026-10-26T06:00", "FREQ=DAILY;COUNT=1"),
  ], window("2026-10-25T00:00", "2026-10-26T12:00"));
  expect(periods).toHaveLength(1);
  expect(local_string(periods[0].from)).toBe("2026-10-25T00:00:00");
  expect(local_string(periods[0].to)).toBe("2026-10-26T06:00:00");
});

Deno.test("COUNT is anchored at the seed, not restarted at query start", () => {
  expect(expand_periods_from_rules([
    seed("2026-07-01T09:00", "2026-07-01T18:00", "FREQ=DAILY;COUNT=2"),
  ], window("2026-11-01T00:00", "2026-11-02T00:00"))).toEqual([]);
});

Deno.test("UTC UNTIL includes its matching start and does not truncate its end", () => {
  const periods = expand_periods_from_rules([
    seed(
      "2026-10-24T09:00",
      "2026-10-24T18:00",
      "RRULE:FREQ=DAILY;UNTIL=20261025T070000Z",
    ),
  ], window("2026-10-24T00:00", "2026-10-27T00:00"));
  expect(periods.map((p) => p.from.toISOString())).toEqual([
    "2026-10-24T06:00:00.000Z",
    "2026-10-25T07:00:00.000Z",
  ]);
  expect(local_string(periods[1].to)).toBe("2026-10-25T18:00:00");
});

Deno.test("day 31 skips months without that date and preserves COUNT", () => {
  const periods = expand_periods_from_rules([
    seed(
      "2026-01-31T09:00",
      "2026-01-31T10:00",
      "FREQ=MONTHLY;BYMONTHDAY=31;COUNT=4",
    ),
  ], window("2026-01-01T00:00", "2026-08-01T00:00"));
  expect(periods.map((p) => local_string(p.from).slice(0, 10))).toEqual([
    "2026-01-31",
    "2026-03-31",
    "2026-05-31",
    "2026-07-31",
  ]);
});

Deno.test("weekday availability remains unbounded across multiple years and DST", () => {
  const periods = expand_periods_from_rules([
    seed(
      "2026-01-05T00:00",
      "2026-01-06T00:00",
      "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    ),
  ], window("2026-01-01T00:00", "2031-01-01T00:00"));
  expect(periods.length).toBeGreaterThan(1200);
  for (const { from, to } of periods) {
    const local = Temporal.Instant.fromEpochMilliseconds(from.getTime())
      .toZonedDateTimeISO("Europe/Kyiv");
    expect(local.dayOfWeek).toBeLessThanOrEqual(5);
    expect(local.hour).toBe(0);
    expect(local_string(to)).toBe(
      local.toPlainDate().add({ days: 1 }).toPlainDateTime().toString(),
    );
  }
  expect(local_string(periods.at(-1)!.from)).toBe("2030-12-31T00:00:00");
});

Deno.test("yearly leap-day recurrence skips non-leap years", () => {
  const periods = expand_periods_from_rules([
    seed("2024-02-29T09:00", "2024-02-29T10:00", "FREQ=YEARLY;COUNT=3"),
  ], window("2024-01-01T00:00", "2033-01-01T00:00"));
  expect(periods.map((p) => local_string(p.from).slice(0, 10))).toEqual([
    "2024-02-29",
    "2028-02-29",
    "2032-02-29",
  ]);
});

Deno.test("one-offs retain exact millisecond instants across DST", () => {
  const rule = {
    start_date: new Date("2026-10-25T00:30:00.123Z"),
    end_date: new Date("2026-10-25T01:30:00.456Z"),
    time_zone: "Europe/Kyiv",
    metadata: { id: "one-off" },
  };
  const before = JSON.stringify(rule);
  const [period] = expand_periods_from_rules(
    [rule],
    window(
      "2026-10-25T00:00",
      "2026-10-26T00:00",
    ),
  );
  expect(period.from).toEqual(rule.start_date);
  expect(period.to).toEqual(rule.end_date);
  expect(period.rule.metadata).toBe(rule.metadata);
  expect(JSON.stringify(rule)).toBe(before);
});

Deno.test("half-open boundaries and millisecond query clipping", () => {
  const rules = [
    seed("2026-01-01T09:00", "2026-01-01T10:00"),
    seed("2026-01-01T10:00", "2026-01-01T11:00"),
    seed("2026-01-01T11:00", "2026-01-01T12:00"),
  ];
  const periods = expand_periods_from_rules(
    rules,
    window(
      "2026-02-01T10:00:00.123",
      "2026-02-01T11:00",
    ),
  );
  expect(periods).toHaveLength(1);
  expect(periods[0].rule).toBe(rules[1]);
  expect(local_string(periods[0].from)).toBe("2026-02-01T10:00:00.123");
  expect(local_string(periods[0].to)).toBe("2026-02-01T11:00:00");
});

Deno.test("gap starts move forward but keep the scheduled local end clock", () => {
  const periods = expand_periods_from_rules([
    seed("2026-03-28T03:30", "2026-03-28T05:00", "FREQ=DAILY;COUNT=3"),
  ], window("2026-03-29T00:00", "2026-03-30T00:00"));
  expect(periods).toHaveLength(1);
  expect(local_string(periods[0].from)).toBe("2026-03-29T04:30:00");
  expect(local_string(periods[0].to)).toBe("2026-03-29T05:00:00");
});

Deno.test("gap endpoints move forward, and collapsed intervals are omitted", () => {
  const periods = expand_periods_from_rules([
    seed("2026-03-28T02:30", "2026-03-28T03:30", "FREQ=DAILY;COUNT=3"),
    seed("2026-03-28T03:30", "2026-03-28T04:00", "FREQ=DAILY;COUNT=3"),
  ], window("2026-03-29T00:00", "2026-03-30T00:00"));
  expect(periods).toHaveLength(1);
  expect(local_string(periods[0].from)).toBe("2026-03-29T02:30:00");
  expect(local_string(periods[0].to)).toBe("2026-03-29T04:30:00");
});

Deno.test("fold starts and ends choose the earlier instant", () => {
  const periods = expand_periods_from_rules([
    seed("2026-10-24T02:30", "2026-10-24T03:30"),
    seed("2026-10-24T03:30", "2026-10-24T04:30"),
  ], window("2026-10-25T00:00", "2026-10-26T00:00"));
  expect(periods[0].to.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  expect(periods[1].from.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  expect(periods[1].to.toISOString()).toBe("2026-10-25T02:30:00.000Z");
});

Deno.test("timezone handling is not hardcoded to Kyiv or whole-hour offsets", () => {
  for (const time_zone of ["America/New_York", "Asia/Kathmandu", "UTC"]) {
    const rule = seed(
      "2026-07-01T09:00",
      "2026-07-01T18:00",
      "FREQ=DAILY",
      time_zone,
    );
    const periods = expand_periods_from_rules([rule], {
      min_date: instant("2026-11-02T00:00", time_zone),
      max_date: instant("2026-11-03T00:00", time_zone),
    });
    expect(periods).toHaveLength(1);
    expect(local_string(periods[0].from, time_zone)).toBe(
      "2026-11-02T09:00:00",
    );
    expect(local_string(periods[0].to, time_zone)).toBe("2026-11-02T18:00:00");
  }
});

Deno.test("chronological output retains metadata and stable ties without mutation", () => {
  const later = {
    ...seed("2026-01-01T12:00", "2026-01-01T13:00"),
    id: "later",
  };
  const first = {
    ...seed("2026-01-01T09:00", "2026-01-01T10:00"),
    id: "first",
  };
  const second = { ...first, id: "second" };
  const rules = Object.freeze(
    [later, first, second].map((rule) => Object.freeze(rule)),
  );
  const before = JSON.stringify(rules);
  const periods = expand_periods_from_rules(
    rules,
    window(
      "2026-01-02T00:00",
      "2026-01-03T00:00",
    ),
  );
  expect(periods.map((p) => p.rule.id)).toEqual(["first", "second", "later"]);
  expect(JSON.stringify(rules)).toBe(before);
});

Deno.test("empty rules yield no periods, but invalid windows still fail", () => {
  expect(expand_periods_from_rules(
    [],
    window(
      "2026-01-01T00:00",
      "2026-01-02T00:00",
    ),
  )).toEqual([]);
  for (const max_date of [new Date(0), new Date(-1), new Date(NaN)]) {
    expect(() =>
      expand_periods_from_rules([], { min_date: new Date(0), max_date })
    )
      .toThrow(RangeError);
  }
});

Deno.test("invalid seeds, timezone and unsupported recurrence inputs fail explicitly", () => {
  const valid = seed("2026-01-01T09:00", "2026-01-01T10:00");
  const invalid: CalendarPeriodRule[] = [
    { ...valid, start_date: new Date(NaN) },
    { ...valid, end_date: valid.start_date },
    { ...valid, end_date: new Date(0) },
    { ...valid, time_zone: "Invalid/Zone" },
    { ...valid, time_zone: "" },
    { ...valid, time_zone: "+02:00" },
    { ...valid, recurrence_rule: "" },
    { ...valid, recurrence_rule: "FREQ=DAILY\nRRULE:FREQ=WEEKLY" },
    { ...valid, recurrence_rule: "NOT_A_RULE" },
    { ...valid, recurrence_rule: "FREQ=HOURLY" },
    { ...valid, recurrence_rule: "FREQ=DAILY;BYHOUR=10" },
    { ...valid, start_date: new Date(valid.start_date.getTime() + 1) },
    { ...valid, end_date: new Date(valid.end_date.getTime() + 1) },
    {
      ...valid,
      start_date: new Date("2026-10-25T00:45:00Z"),
      end_date: new Date("2026-10-25T01:15:00Z"),
    },
  ];
  for (const rule of invalid) {
    expect(() =>
      expand_periods_from_rules(
        [rule],
        window(
          "2026-01-01T00:00",
          "2027-01-01T00:00",
        ),
      )
    ).toThrow();
  }
});
