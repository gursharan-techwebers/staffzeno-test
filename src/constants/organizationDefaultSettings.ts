import type {
  WorkingDay,
  WorkingSaturday,
  UpdateAttendanceSettingsInput,
} from "@/validators/organization/settings/attendance";

import type { UpdateLeaveManagementInput } from "@/validators/organization/settings/leave";

/**
 * Organization default settings
 */
export const ORGANIZATION_DEFAULT_SETTINGS = {
  attendance: {
    officeStartTime: "00:00",
    officeEndTime: "00:01",
    gracePeriod: 0,

    // Monday-Saturday are working days.
    // Sunday is the weekly day off.
    workingDays: ["monday"] satisfies WorkingDay[],

    // All Saturdays are working by default.
    workingSaturdays: [1, 2, 3, 4, 5] satisfies WorkingSaturday[],
  } satisfies UpdateAttendanceSettingsInput,

  leave: {
    monthlyPaidLeaves: 0,
    monthlyPaidHalfDayLeaves: 0,
    monthlyPaidShortLeaves: 0,
    shortLeaveDuration: 0,
    carryForwardEnabled: false,
    leaveEncashmentEnabled: false,
  } satisfies UpdateLeaveManagementInput,
} as const;

/**
 * Organization working days
 */
export const ORGANIZATION_WORKING_DAYS = [
  {
    value: "monday",
    label: "Monday",
  },
  {
    value: "tuesday",
    label: "Tuesday",
  },
  {
    value: "wednesday",
    label: "Wednesday",
  },
  {
    value: "thursday",
    label: "Thursday",
  },
  {
    value: "friday",
    label: "Friday",
  },
  {
    value: "saturday",
    label: "Saturday",
  },
  {
    value: "sunday",
    label: "Sunday",
  },
] satisfies ReadonlyArray<{
  value: WorkingDay;
  label: string;
}>;

/**
 * Organization grace periods
 */
export const ORGANIZATION_GRACE_PERIODS = [
  {
    value: "0",
    label: "No grace period",
  },
  {
    value: "5",
    label: "5 minutes",
  },
  {
    value: "10",
    label: "10 minutes",
  },
  {
    value: "15",
    label: "15 minutes",
  },
  {
    value: "20",
    label: "20 minutes",
  },
  {
    value: "30",
    label: "30 minutes",
  },
] as const satisfies ReadonlyArray<{
  value: `${number}`;
  label: string;
}>;

/**
 * Organization working Saturdays
 */
export const ORGANIZATION_WORKING_SATURDAYS = [
  {
    value: 1,
    label: "1st Saturday",
  },
  {
    value: 2,
    label: "2nd Saturday",
  },
  {
    value: 3,
    label: "3rd Saturday",
  },
  {
    value: 4,
    label: "4th Saturday",
  },
  {
    value: 5,
    label: "5th Saturday",
  },
] as const satisfies ReadonlyArray<{
  value: WorkingSaturday;
  label: string;
}>;

/**
 * Organization short leave durations
 */
export const ORGANIZATION_SHORT_LEAVE_DURATIONS = [
  {
    value: "0",
    label: "0",
  },
  {
    value: "30",
    label: "30 minutes",
  },
  {
    value: "60",
    label: "1 hour",
  },
  {
    value: "90",
    label: "1 hour 30 minutes",
  },
  {
    value: "120",
    label: "2 hours",
  },
] as const satisfies ReadonlyArray<{
  value: "0" | "30" | "60" | "90" | "120";
  label: string;
}>;
