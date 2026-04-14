export const BOOKING_START_HOUR = 8;
export const BOOKING_END_HOUR = 23;
export const ALL_BOOKING_HOURS = Array.from(
  { length: BOOKING_END_HOUR - BOOKING_START_HOUR + 1 },
  (_, index) => BOOKING_START_HOUR + index
);

export type AvailabilityEntry = {
  date: string;
  hours: number[];
};

export type AvailabilityCalendar = Record<string, number[]>;

const monthRegex = /^\d{4}-\d{2}$/;

export const isAllowedBookingHour = (hour: number): boolean =>
  Number.isInteger(hour) && hour >= BOOKING_START_HOUR && hour <= BOOKING_END_HOUR;

export const normalizeHours = (hours: number[]): number[] =>
  [...new Set(hours)].sort((left, right) => left - right);

export const normalizeAvailabilityEntries = (entries: AvailabilityEntry[]): AvailabilityEntry[] =>
  entries
    .map((entry) => ({
      date: entry.date,
      hours: normalizeHours(entry.hours)
    }))
    .filter((entry) => entry.hours.length > 0)
    .sort((left, right) => left.date.localeCompare(right.date));

export const availabilityEntriesToCalendar = (
  entries: AvailabilityEntry[] | undefined | null
): AvailabilityCalendar => {
  const calendar: AvailabilityCalendar = {};

  for (const entry of entries ?? []) {
    const hours = normalizeHours(entry.hours);
    if (hours.length > 0) {
      calendar[entry.date] = hours;
    }
  }

  return calendar;
};

export const availabilityCalendarToEntries = (
  calendar: AvailabilityCalendar | undefined | null
): AvailabilityEntry[] =>
  normalizeAvailabilityEntries(
    Object.entries(calendar ?? {}).map(([date, hours]) => ({
      date,
      hours
    }))
  );

export const mergeHours = (left: number[], right: number[]): number[] => normalizeHours([...left, ...right]);

export const subtractHours = (source: number[], toRemove: number[]): number[] => {
  const removeSet = new Set(toRemove);
  return normalizeHours(source.filter((hour) => !removeSet.has(hour)));
};

export const mergeCalendars = (...calendars: AvailabilityCalendar[]): AvailabilityCalendar => {
  const merged: AvailabilityCalendar = {};

  for (const calendar of calendars) {
    for (const [date, hours] of Object.entries(calendar)) {
      merged[date] = mergeHours(merged[date] ?? [], hours);
    }
  }

  return merged;
};

export const buildCalendarWindow = (month?: string) => {
  const now = new Date();

  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth();

  if (month) {
    if (!monthRegex.test(month)) {
      throw new Error('month must be in YYYY-MM format');
    }

    const [yearValue, monthValue] = month.split('-').map(Number);
    year = yearValue;
    monthIndex = monthValue - 1;
  }

  const from = new Date(Date.UTC(year, monthIndex - 1, 1));
  const to = new Date(Date.UTC(year, monthIndex + 2, 0));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
};

export const filterCalendarToWindow = (
  calendar: AvailabilityCalendar,
  range: { from: string; to: string }
): AvailabilityCalendar =>
  Object.fromEntries(
    Object.entries(calendar)
      .filter(([date]) => date >= range.from && date <= range.to)
      .sort(([left], [right]) => left.localeCompare(right))
  );

export const upsertAvailabilityEntry = (
  entries: AvailabilityEntry[],
  date: string,
  hours: number[]
): AvailabilityEntry[] => {
  const nextEntries = availabilityEntriesToCalendar(entries);
  const nextHours = mergeHours(nextEntries[date] ?? [], hours);

  if (nextHours.length > 0) {
    nextEntries[date] = nextHours;
  }

  return availabilityCalendarToEntries(nextEntries);
};

export const removeAvailabilityEntryHours = (
  entries: AvailabilityEntry[],
  date: string,
  hours: number[]
): AvailabilityEntry[] => {
  const nextEntries = availabilityEntriesToCalendar(entries);
  const currentHours = nextEntries[date] ?? [];
  const nextHours = subtractHours(currentHours, hours);

  if (nextHours.length === 0) {
    delete nextEntries[date];
  } else {
    nextEntries[date] = nextHours;
  }

  return availabilityCalendarToEntries(nextEntries);
};
