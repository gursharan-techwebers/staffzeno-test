"use server";

import "server-only";

const AUTO_CLOSE_HOUR = 23;
const AUTO_CLOSE_MINUTE = 50;

export async function getAttendanceCloseTime(
  now: Date,
  timezone: string,
): Promise<Date> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);

  const month = Number(parts.find((part) => part.type === "month")?.value);

  const day = Number(parts.find((part) => part.type === "day")?.value);

  /*
   * Build the organization's local 11:50 PM.
   *
   * We start with the UTC timestamp that has the desired
   * local calendar components, then determine the timezone
   * offset and convert it into the actual UTC instant.
   */
  const targetUtc = Date.UTC(
    year,
    month - 1,
    day,
    AUTO_CLOSE_HOUR,
    AUTO_CLOSE_MINUTE,
    0,
    0,
  );

  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const offsetParts = offsetFormatter.formatToParts(new Date(targetUtc));

  const offset = offsetParts.find(
    (part) => part.type === "timeZoneName",
  )?.value;

  if (!offset || offset === "GMT") {
    return new Date(targetUtc);
  }

  const match = offset.match(/^GMT([+-])(\d{2}):?(\d{2})$/);

  if (!match) {
    throw new Error(`Unable to determine timezone offset for ${timezone}`);
  }

  const [, sign, hours, minutes] = match;

  const offsetMinutes = Number(hours) * 60 + Number(minutes);

  const signedOffsetMinutes = sign === "+" ? offsetMinutes : -offsetMinutes;

  return new Date(targetUtc - signedOffsetMinutes * 60 * 1000);
}
