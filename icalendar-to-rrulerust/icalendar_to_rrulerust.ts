import { Frequency, Weekday } from "rrule-rust";

export const ICalendarToRruleRust = {
  weekday,
  frequency,
};

function weekday(dayNumber: number): Weekday {
  switch (dayNumber) {
    case 1:
      return Weekday.Monday;
    case 2:
      return Weekday.Tuesday;
    case 3:
      return Weekday.Wednesday;
    case 4:
      return Weekday.Thursday;
    case 5:
      return Weekday.Friday;
    case 6:
      return Weekday.Saturday;
    case 0:
      return Weekday.Sunday;
  }

  console.warn(`Invalid day number: ${dayNumber}. Defaulting to Sunday.`);

  return Weekday.Sunday;
}

function frequency(freq: FrequencyICalendar | string): Frequency {
  switch (freq) {
    case "daily":
      return Frequency.Daily;
    case "weekly":
      return Frequency.Weekly;
    case "monthly":
      return Frequency.Monthly;
    case "yearly":
      return Frequency.Yearly;
  }

  console.warn(`Invalid frequency: ${freq}. Defaulting to daily.`);

  return Frequency.Daily;
}

type FrequencyICalendar = "daily" | "weekly" | "monthly" | "yearly";
