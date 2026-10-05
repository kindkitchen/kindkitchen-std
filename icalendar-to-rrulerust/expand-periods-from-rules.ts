import { Temporal } from "@js-temporal/polyfill";
import {
  DateTime,
  DtStart,
  Frequency,
  RRule,
  RRuleSet,
  type Time,
} from "rrule-rust";

/** An instant-based seed; recurring occurrences keep its local start/end clocks. */
export interface CalendarPeriodRule {
  start_date: Date;
  end_date: Date;
  time_zone: string;
  /**
   * One daily/weekly/monthly/yearly RFC5545 RRULE, optionally prefixed `RRULE:`.
   * BYHOUR/BYMINUTE/BYSECOND are unsupported: the seed defines both clocks.
   * Omit for one-offs.
   */
  recurrence_rule?: string;
}

/** A finite, half-open query window: [min_date, max_date). */
export interface PeriodWindow {
  min_date: Date;
  max_date: Date;
}

/** A clipped occurrence retaining the original rule and all caller metadata. */
export interface ExpandedPeriod<T extends CalendarPeriodRule> {
  from: Date;
  to: Date;
  rule: T;
}

/**
 * Expand local-wall-clock recurrences into clipped instant intervals.
 *
 * Recurring seeds have whole-second precision. Endpoints use compatible DST
 * disambiguation: earlier instant in a fold, forward by the gap in a gap.
 * A collapsed occurrence (end <= start after disambiguation) is omitted.
 * One-offs retain their exact instants, including milliseconds.
 *
 * Results are chronological, stable in input order for equal starts. Rule
 * objects are not mutated. COUNT/UNTIL constrain starts, not occurrence ends.
 * Callers must bound query size/frequency; this synchronous API materializes
 * every matching occurrence and is not an untrusted-input resource limiter.
 */
export function expand_periods_from_rules<T extends CalendarPeriodRule>(
  rules: readonly T[],
  { min_date, max_date }: PeriodWindow,
): ExpandedPeriod<T>[] {
  const min_ms = valid_timestamp(min_date, "min_date");
  const max_ms = valid_timestamp(max_date, "max_date");
  if (min_ms >= max_ms) {
    throw new RangeError("min_date must be before max_date");
  }

  const periods: ExpandedPeriod<T>[] = [];
  const append = (rule: T, start_ms: number, end_ms: number): void => {
    const from_ms = Math.max(start_ms, min_ms);
    const to_ms = Math.min(end_ms, max_ms);
    if (from_ms < to_ms) {
      periods.push({ from: new Date(from_ms), to: new Date(to_ms), rule });
    }
  };

  for (const rule of rules) {
    const start_ms = valid_timestamp(rule.start_date, "start_date");
    const end_ms = valid_timestamp(rule.end_date, "end_date");
    if (start_ms >= end_ms) {
      throw new RangeError("start_date must be before end_date");
    }
    // Resolve even one-off timezones so invalid input never passes silently.
    const start_local = local_instant(start_ms, rule.time_zone);
    const end_local = local_instant(end_ms, rule.time_zone);

    if (rule.recurrence_rule === undefined) {
      append(rule, start_ms, end_ms);
      continue;
    }
    if (start_ms % 1000 !== 0 || end_ms % 1000 !== 0) {
      throw new RangeError("Recurring seeds require whole-second precision");
    }
    if (
      Temporal.PlainDateTime.compare(
        start_local.toPlainDateTime(),
        end_local.toPlainDateTime(),
      ) >= 0
    ) {
      throw new RangeError("Recurring local end must be after local start");
    }

    if (!rule.recurrence_rule.trim() || /[\r\n]/.test(rule.recurrence_rule)) {
      throw new RangeError("recurrence_rule must contain one non-empty RRULE");
    }
    const recurrence = RRule.fromString<DateTime<Time>>(rule.recurrence_rule);
    if (
      recurrence.frequency > Frequency.Daily ||
      recurrence.byHour.length || recurrence.byMinute.length ||
      recurrence.bySecond.length
    ) {
      throw new RangeError("Recurrence must keep the seed's daily start clock");
    }
    const day_offset = end_local.toPlainDate().since(
      start_local.toPlainDate(),
      { largestUnit: "day" },
    ).days;
    const end_time = end_local.toPlainTime();
    const dtstart = new DtStart(
      DateTime.local(
        start_local.year,
        start_local.month,
        start_local.day,
        start_local.hour,
        start_local.minute,
        start_local.second,
      ),
      rule.time_zone,
    );
    const set = new RRuleSet({ dtstart, rrules: [recurrence] });
    // Include starts before the window whose ends can overlap it. Extra local
    // days cover disambiguation around DST/date-line transitions, not just 24h.
    const search_start = local_instant(min_ms, rule.time_zone)
      .subtract({ days: day_offset + 2 });
    const occurrences = set.between(
      DateTime.fromDate(new Date(search_start.epochMilliseconds)),
      DateTime.fromDate(max_date),
      true,
    );
    for (const occurrence of occurrences) {
      const occurrence_ms = occurrence.toDate().getTime();
      const occurrence_local = local_instant(occurrence_ms, rule.time_zone);
      const end = occurrence_local.toPlainDate().add({ days: day_offset })
        .toPlainDateTime(end_time).toZonedDateTime(rule.time_zone, {
          disambiguation: "compatible",
        });
      append(rule, occurrence_ms, end.epochMilliseconds);
    }
  }

  return periods.sort((a, b) => a.from.getTime() - b.from.getTime());
}

function valid_timestamp(value: Date, label: string): number {
  const timestamp = value.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`${label} must be a valid Date`);
  }
  return timestamp;
}

function local_instant(
  timestamp: number,
  time_zone: string,
): Temporal.ZonedDateTime {
  if (!time_zone || /^[+-]/.test(time_zone)) {
    throw new RangeError("time_zone must be a named IANA timezone");
  }
  return Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(
    time_zone,
  );
}
