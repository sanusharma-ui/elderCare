import { TimeSlot } from "@prisma/client";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Derives a TimeSlot from an "HH:mm" 24-hour time string:
 * - 05:00 to 11:59 => MORNING
 * - 12:00 to 16:59 => AFTERNOON
 * - 17:00 to 20:59 => EVENING
 * - 21:00 to 04:59 => NIGHT
 */
export function deriveTimeSlot(timeOfDay: string): TimeSlot {
  const parts = timeOfDay.split(":");
  const hours = parseInt(parts[0], 10);

  if (hours >= 5 && hours < 12) {
    return TimeSlot.MORNING;
  }
  if (hours >= 12 && hours < 17) {
    return TimeSlot.AFTERNOON;
  }
  if (hours >= 17 && hours < 21) {
    return TimeSlot.EVENING;
  }
  return TimeSlot.NIGHT;
}

/**
 * Gets the current date string (YYYY-MM-DD) in the specified timezone.
 */
export function getTodayDateString(timezone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

/**
 * Gets the current day of the week (0 = Sunday ... 6 = Saturday) in the specified timezone.
 */
export function getDayOfWeekInTimezone(
  date: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE
): number {
  const zonedDate = toZonedTime(date, timezone);
  return zonedDate.getDay();
}

/**
 * Converts a date string (YYYY-MM-DD) and "HH:mm" time in a given timezone to a UTC Date.
 */
export function parseLocalScheduleToUtc(
  dateString: string,
  timeOfDay: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const localIsoString = `${dateString}T${timeOfDay}:00`;
  return fromZonedTime(localIsoString, timezone);
}

/**
 * Slot order comparator for organizing doses in /today
 */
export const TIME_SLOT_ORDER: Record<TimeSlot, number> = {
  [TimeSlot.MORNING]: 1,
  [TimeSlot.AFTERNOON]: 2,
  [TimeSlot.EVENING]: 3,
  [TimeSlot.NIGHT]: 4,
};
