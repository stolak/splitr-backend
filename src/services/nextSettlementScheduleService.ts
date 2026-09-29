import prisma from "../utils/prisma";

const DEFAULT_ID = "next_settlement_schedule";
const CANADA_TIME_ZONE = process.env.CANADA_TIMEZONE?.trim() || "America/Toronto";

function requireDate(value: unknown, field: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error(`${field} must be a valid date`);
}

function optionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  return requireDate(value, field);
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let utc = new Date(desiredAsUtcMs);

  for (let i = 0; i < 2; i += 1) {
    const local = getZonedParts(utc, timeZone);
    const actualAsUtcMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
      0
    );
    utc = new Date(utc.getTime() + (desiredAsUtcMs - actualAsUtcMs));
  }

  return utc;
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
): { year: number; month: number; day: number } {
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function defaultScheduleDates(now = new Date(), timeZone = CANADA_TIME_ZONE) {
  const localNow = getZonedParts(now, timeZone);
  const today2359 = zonedLocalToUtc(localNow.year, localNow.month, localNow.day, 23, 59, timeZone);

  let settlementDay = {
    year: localNow.year,
    month: localNow.month,
    day: localNow.day,
  };
  if (now.getTime() >= today2359.getTime()) {
    settlementDay = addCalendarDays(localNow.year, localNow.month, localNow.day, 1);
  }

  const nextSettlementDate = zonedLocalToUtc(
    settlementDay.year,
    settlementDay.month,
    settlementDay.day,
    23,
    59,
    timeZone
  );

  const payoutDay = addCalendarDays(settlementDay.year, settlementDay.month, settlementDay.day, 1);
  const nextPayOutDate = zonedLocalToUtc(
    payoutDay.year,
    payoutDay.month,
    payoutDay.day,
    11,
    59,
    timeZone
  );

  return { nextSettlementDate, nextPayOutDate };
}

export class NextSettlementScheduleService {
  async get() {
    const existing = await prisma.nextSettlementSchedule.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;

    const { nextSettlementDate, nextPayOutDate } = defaultScheduleDates();
    return prisma.nextSettlementSchedule.create({
      data: {
        id: DEFAULT_ID,
        nextSettlementDate,
        nextPayOutDate,
      },
    });
  }

  async upsert(input: { nextSettlementDate?: unknown; nextPayOutDate?: unknown }) {
    const nextSettlementDate = optionalDate(input.nextSettlementDate, "nextSettlementDate");
    const nextPayOutDate = optionalDate(input.nextPayOutDate, "nextPayOutDate");

    if (nextSettlementDate === undefined && nextPayOutDate === undefined) {
      throw new Error("At least one field is required");
    }

    const existing = await prisma.nextSettlementSchedule.findUnique({
      where: { id: DEFAULT_ID },
      select: { id: true },
    });

    if (!existing) {
      if (nextSettlementDate === undefined || nextPayOutDate === undefined) {
        throw new Error("nextSettlementDate and nextPayOutDate are required");
      }
      return prisma.nextSettlementSchedule.create({
        data: {
          id: DEFAULT_ID,
          nextSettlementDate,
          nextPayOutDate,
        },
      });
    }

    return prisma.nextSettlementSchedule.update({
      where: { id: DEFAULT_ID },
      data: {
        ...(nextSettlementDate !== undefined && { nextSettlementDate }),
        ...(nextPayOutDate !== undefined && { nextPayOutDate }),
      },
    });
  }
}

export const nextSettlementScheduleService = new NextSettlementScheduleService();
