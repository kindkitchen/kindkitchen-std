# @kindkitchen/icalendar-to-rrulerust

Calendar conversion, timezone-aware recurring intervals and priority resolution.
Uses `rrule-rust` for recurrence and `@js-temporal/polyfill` for portable local
calendar arithmetic; no global Temporal or process timezone configuration is
required.

## Expand recurring intervals

```ts
import { expand_periods_from_rules } from "@kindkitchen/icalendar-to-rrulerust";

const periods = expand_periods_from_rules([
  {
    id: "working-hours",
    // Real instants: 09:00–18:00 in Kyiv in July.
    start_date: new Date("2026-07-01T06:00:00Z"),
    end_date: new Date("2026-07-01T15:00:00Z"),
    time_zone: "Europe/Kyiv",
    recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  },
], {
  min_date: new Date("2026-11-02T00:00:00Z"),
  max_date: new Date("2026-11-03T00:00:00Z"),
});

// periods[0].from === 2026-11-02T07:00:00.000Z (09:00 local)
// periods[0].to   === 2026-11-02T16:00:00.000Z (18:00 local)
// periods[0].rule.id === "working-hours"
```

### Input and output contract

- `start_date` and `end_date` are valid JavaScript `Date` **instants**, not
  local wall-clock strings disguised as UTC. End must be strictly after start.
- `time_zone` is a named IANA timezone, including `UTC`. Numeric offset strings
  are rejected. Timezones are checked even for one-off rules.
- Omit `recurrence_rule` for a one-off. Its exact instants, including
  milliseconds and fold choices, are preserved before query clipping.
- A recurring rule is one RFC5545 RRULE string, with or without `RRULE:`. Daily,
  weekly, monthly and yearly frequencies are supported, including `INTERVAL`,
  `COUNT`, `UNTIL` and date selectors. Subdaily frequencies and
  `BYHOUR`/`BYMINUTE`/`BYSECOND` are rejected: this API repeats the seed's
  start/end clocks rather than expressing variable intraday events.
- Recurring seeds must have whole-second precision and a positive **local**
  start-to-end span. A seed crossing a backward clock change whose local end
  equals/precedes its local start is rejected, not silently reinterpreted.
- Endpoints repeat the seed's local clock times and calendar-date offset. For
  example, a midnight-to-next-midnight rule lasts 23 or 25 elapsed hours on DST
  transition days. An overnight 22:00–06:00 rule keeps both local times.
- DST disambiguation is **compatible**: choose the earlier instant in a fold;
  move nonexistent local times forward by the gap. Resolve starts and ends
  independently. A gap-shifted start does not shift the scheduled end clock;
  omit an occurrence if its resolved end is at/before its start. Omitted
  occurrences still consume the recurrence engine's `COUNT`.
- The query is a finite, non-empty half-open interval `[min_date, max_date)`.
  Both bounds are required. Starts before the window are included when their
  ends overlap it; every output is clipped to the window. Touching endpoints are
  not overlaps.
- `COUNT` and `UNTIL` retain their seed-based semantics, limiting occurrence
  **starts**, not ends. Prefer UTC `UNTIL` instants for interoperable wire data.
  An unbounded recurrence stays unbounded; the query limits materialization.
- Results are `{ from: Date, to: Date, rule: T }[]`, chronological with stable
  input order for equal clipped starts. `rule` is the original object, retaining
  all caller metadata. Inputs are not mutated; separate rules and overlapping
  occurrences are not merged or deduplicated.
- Invalid input throws. The synchronous API materializes occurrences: callers
  must impose application-specific query-size and rule-count limits before
  accepting untrusted requests.

This API does not infer all-day flags, working weekdays, privacy, cooperation
identity or daily availability statuses. Those remain caller policy.

## Resolve overlapping periods

```ts
import { resolve_periods_with_priorities } from "@kindkitchen/icalendar-to-rrulerust";

const segments = resolve_periods_with_priorities([
  {
    id: "a",
    from: new Date("2026-11-02T07:00:00Z"),
    to: new Date("2026-11-02T11:00:00Z"),
    priority: 100,
  },
  {
    id: "b",
    from: new Date("2026-11-02T09:00:00Z"),
    to: new Date("2026-11-02T13:00:00Z"),
    priority: 100,
  },
], {
  min_date: new Date("2026-11-02T00:00:00Z"),
  max_date: new Date("2026-11-03T00:00:00Z"),
}, {
  tie_break: "first",
});
```

Highest priority wins. The optional `tie_break` policy chooses `first` or `last`
in **active-set insertion order** for equal priorities. Activation follows start
coordinates clipped to the query window, with input order preserved for equal
coordinates. Thus this is not always the original input-array order.

Omitting the option preserves the existing `last` policy. Output shape remains
`{ from: number, to: number, winner: T, conflicts: T[] }[]`; boundaries are
epoch milliseconds. `conflicts` contains every other active source item, not
just same-priority items, and does not itself mean a domain-specific conflict. A
caller may need to filter personal entries or deduplicate identities before
computing its conflict flag.

Uncovered segments are omitted. Enumerate calendar dates separately if empty
working/non-working days need to be returned. Adjacent segments are not merged.
The existing resolver's input handling is unchanged; callers should supply valid
positive-length periods, finite priorities and a valid finite query window.

## Existing conversions

`ICalendarToRruleRust.weekday` maps Sunday=0 through Saturday=6 to the engine's
weekday enum. `frequency` maps `daily`, `weekly`, `monthly`, `yearly` to its
frequency enum. Their existing warning/fallback behavior for unsupported values
is unchanged.

## 0.3.0 upgrade notes

- Adds `expand_periods_from_rules`, its exported input/window/result types and
  the Temporal polyfill dependency.
- Adds the optional `tie_break` resolver policy without changing defaults.
- Adds dedicated recurrence, resolver and conversion regressions.
- Does not require a new `std-sweep-line` or `rrule-rust` version.
- Existing UTC-compensated application data must not be passed into the new API
  without coordinated interpretation/conversion. Updating this dependency alone
  does not migrate data or change a consumer's calendar implementation.

## Verification

Run from the workspace root:

```nu
deno test -A ./icalendar-to-rrulerust ./sweep_line/test_make_sweep_line
deno check ./icalendar-to-rrulerust/mod.ts
```

Tests exercise both DST transitions, summer-to-winter wall clocks, 23/25-hour
all-day spans, overnight/multi-day clipping, gaps/folds, bounded queries of
unbounded rules, COUNT/UNTIL, month-day 31, leap years, metadata and resolver
compatibility. They use the real recurrence engine rather than mocked dates.
