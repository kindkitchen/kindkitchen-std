import { expect } from "@std/expect";
import { Frequency, Weekday } from "rrule-rust";
import { ICalendarToRruleRust } from "./mod.ts";

Deno.test("weekday conversion preserves Sunday=0 public convention", () => {
  expect(Array.from({ length: 7 }, (_, i) => ICalendarToRruleRust.weekday(i)))
    .toEqual([
      Weekday.Sunday,
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday,
    ]);
});

Deno.test("frequency conversion preserves all supported values", () => {
  expect(
    ["daily", "weekly", "monthly", "yearly"].map(
      ICalendarToRruleRust.frequency,
    ),
  )
    .toEqual([
      Frequency.Daily,
      Frequency.Weekly,
      Frequency.Monthly,
      Frequency.Yearly,
    ]);
});
