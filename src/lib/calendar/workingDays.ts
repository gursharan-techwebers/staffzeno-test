import type {
  WorkingDay,
  WorkingSaturday,
} from "@/validators/organization/settings/attendance";

const isSaturdayWorking = (
  date: Date,
  workingSaturdays: readonly WorkingSaturday[],
) => {
  if (date.getDay() !== 6) {
    return false;
  }

  const saturdayNumber = Math.ceil(date.getDate() / 7);

  return workingSaturdays.includes(
    saturdayNumber as WorkingSaturday,
  );
};

const isNonWorkingDay = (
  date: Date,
  workingDays: readonly WorkingDay[],
  workingSaturdays: readonly WorkingSaturday[],
) => {
  const dayNames: WorkingDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const dayName = dayNames[date.getDay()];

  /*
   * Saturday has two conditions:
   *
   * 1. Saturday must be enabled in workingDays.
   * 2. The particular Saturday occurrence must be selected
   *    in workingSaturdays.
   */
  if (dayName === "saturday") {
    return (
      !workingDays.includes("saturday") ||
      !isSaturdayWorking(date, workingSaturdays)
    );
  }

  return !workingDays.includes(dayName);
};

export const getCalendarNonWorkingDates = ({
  workingDays,
  workingSaturdays,
}: {
  workingDays: readonly WorkingDay[];
  workingSaturdays: readonly WorkingSaturday[];
}) => {
  const dates: Date[] = [];

  const start = new Date();
  start.setMonth(start.getMonth() - 12);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setMonth(end.getMonth() + 24);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);

  while (current <= end) {
    if (
      isNonWorkingDay(
        current,
        workingDays,
        workingSaturdays,
      )
    ) {
      dates.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
};