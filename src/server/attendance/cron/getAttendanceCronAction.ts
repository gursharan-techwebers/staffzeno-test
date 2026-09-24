type AttendanceCronAction = "WARNING" | "CLOSE" | null;

const WARNING_START_MINUTE = 23 * 60 + 40; // 11:40 PM
const CLOSE_START_MINUTE = 23 * 60 + 50; // 11:50 PM
const DAY_END_MINUTE = 24 * 60; // 12:00 AM

function getLocalMinutes(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hour * 60 + minute;
}

export function getAttendanceCronAction(
  date: Date,
  timezone: string,
): AttendanceCronAction {
  const localMinutes = getLocalMinutes(date, timezone);

  // 11:40 PM–11:49 PM
  if (
    localMinutes >= WARNING_START_MINUTE &&
    localMinutes < CLOSE_START_MINUTE
  ) {
    return "WARNING";
  }

  // 11:50 PM–11:59 PM
  if (localMinutes >= CLOSE_START_MINUTE && localMinutes < DAY_END_MINUTE) {
    return "CLOSE";
  }

  return null;
}
