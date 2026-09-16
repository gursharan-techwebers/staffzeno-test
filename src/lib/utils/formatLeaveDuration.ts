import {
  HalfDayPeriod,
  LEAVE_DURATIONS,
  LeaveDuration,
} from "@/types/organization/leave";

type FormatLeaveDurationParams = {
  duration: LeaveDuration;
  halfDayPeriod: HalfDayPeriod | null;
  startTime: string | null;
  endTime: string | null;
  startDate: Date | string;
  endDate: Date | string;
};

export function formatLeaveDuration({
  duration,
  halfDayPeriod,
  startTime,
  endTime,
  startDate,
  endDate,
}: FormatLeaveDurationParams): string {
  const durationName = LEAVE_DURATIONS[duration].name;

  switch (duration) {
    case "FULL_DAY":
      return durationName;

    case "MULTIPLE_DAYS": {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const days =
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      return `${String(days).padStart(2, "0")} Days`;
    }

    case "HALF_DAY":
      return halfDayPeriod === "FIRST_HALF"
        ? `${durationName} · First Half`
        : `${durationName} · Second Half`;

    case "SHORT_LEAVE":
      return startTime && endTime
        ? `${durationName} · ${startTime} – ${endTime}`
        : durationName;

    default:
      return durationName;
  }
}
