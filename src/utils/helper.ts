/**
 * Normalizes a date to midnight (00:00:00.000)
 * Useful for date comparisons without time component
 * @param date - Date to normalize (can be Date object, string, or number)
 * @returns Date object set to midnight
 */
export function normalizeToMidnight(date: Date | string | number): Date {
  return new Date(new Date(date).setHours(23, 59, 59, 0));
}

export function normalizeToEalerMoning(date: Date | string | number): Date {
  return new Date(new Date(date).setHours(0, 0, 0, 0));
}

/**
 * Gets the current date normalized to midnight
 * @returns Current date at 00:00:00.000
 */
export function getTodayAtMidnight(): Date {
  return normalizeToMidnight(new Date());
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonthsUTC(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const next = new Date(Date.UTC(year, month + months, day));

  const expectedMonth = (month + months) % 12;
  if (next.getUTCMonth() !== expectedMonth) {
    return new Date(Date.UTC(year, month + months + 1, 0));
  }

  return next;
}

export type InstallmentCycleType =
  | "Weekly"
  | "BiWeekly"
  | "Monthly"
  | "BiMonthly"
  | "Quarterly"
  | "BiQuarterly"
  | "HalfYearly"
  | "BiHalfYearly"
  | "Yearly"
  | "BiYearly"
  | "OneTime";

export function getNextCycleByInstallmentType(
  dateStr: string,
  installmentType: InstallmentCycleType = "Monthly"
): Date {
  const date = new Date(dateStr);

  switch (installmentType) {
    case "Weekly":
      return addDaysUTC(date, 7);
    case "BiWeekly":
      return addDaysUTC(date, 14);
    case "Monthly":
      return getNextCycle(dateStr);
    case "BiMonthly":
      return addMonthsUTC(date, 2);
    case "Quarterly":
      return addMonthsUTC(date, 3);
    case "BiQuarterly":
    case "HalfYearly":
      return addMonthsUTC(date, 6);
    case "BiHalfYearly":
    case "Yearly":
      return addMonthsUTC(date, 12);
    case "BiYearly":
      return addMonthsUTC(date, 24);
    case "OneTime":
      return date;
    default:
      return getNextCycle(dateStr);
  }
}

export function getDayBeforeNextCycleByInstallmentType(
  dateStr: string,
  installmentType: InstallmentCycleType = "Monthly"
): Date {
  if (installmentType === "OneTime") {
    return new Date(dateStr);
  }

  const nextCycle = getNextCycleByInstallmentType(dateStr, installmentType);
  return addDaysUTC(nextCycle, -1);
}

export function getNextCycle(dateStr: string): Date {
  const date = new Date(dateStr);

  const year: number = date.getUTCFullYear();
  const month: number = date.getUTCMonth(); // 0-based
  const day: number = date.getUTCDate();

  // Try same day next month (using UTC)
  const next = new Date(Date.UTC(year, month + 1, day));

  // If month overflowed → next month doesn't have this day
  if (next.getUTCMonth() !== (month + 1) % 12) {
    // Set to last day of next month
    return new Date(Date.UTC(year, month + 2, 0)); // day 0 = last day of (month+1)
  }

  return next;
}

export function getDayBeforeNextCycle(dateStr: string): Date {
  const nextCycle = getNextCycle(dateStr);

  // Subtract 1 day (in ms)
  const oneDayBefore = new Date(nextCycle.getTime() - 24 * 60 * 60 * 1000);

  return oneDayBefore;
}
