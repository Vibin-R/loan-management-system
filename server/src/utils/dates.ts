/**
 * Calendar-date helpers in Indian Standard Time.
 * Timestamps are stored in UTC, but rules like "age today" and "not a future date" are about the
 * borrower's calendar day in India, so they must not depend on the server's time zone.
 */
const IST_OFFSET_MINUTES = 330;
const MS_PER_MINUTE = 60_000;

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/** The IST calendar date on which an instant falls. */
export function toISTCalendarDate(instant: Date): CalendarDate {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MINUTES * MS_PER_MINUTE);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export const todayIST = (): CalendarDate => toISTCalendarDate(new Date());

/** Midnight IST of the given calendar date, as a UTC instant (how date-only fields are stored). */
export function istMidnight({ year, month, day }: CalendarDate): Date {
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MINUTES * MS_PER_MINUTE);
}

/** Parses `YYYY-MM-DD`; returns null for malformed or impossible dates such as 2026-02-30. */
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  const valid =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day;
  return valid ? { year, month, day } : null;
}

/** Negative if a is before b, 0 if the same day, positive if after. */
export const compareCalendarDates = (a: CalendarDate, b: CalendarDate): number =>
  a.year - b.year || a.month - b.month || a.day - b.day;

/** Completed years between a birth date and `on` (birthday not yet reached → one less). */
export function ageOn(birthDate: CalendarDate, on: CalendarDate = todayIST()): number {
  const hadBirthday =
    on.month > birthDate.month || (on.month === birthDate.month && on.day >= birthDate.day);
  return on.year - birthDate.year - (hadBirthday ? 0 : 1);
}

export const formatCalendarDate = ({ year, month, day }: CalendarDate): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
