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
    // IANA timezone used for attendance date/time calculations.
    timezone: "",

    minimumWorkingMinutes: 240,
    gracePeriod: 0,

    finalizationWindowMinutes: 180,

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
 * Attendance finalization window.
 *
 * Attendance for a calendar day remains open for 3 hours
 * after the day ends. After this window, employee changes
 * are no longer allowed. Organization admins/owners can
 * still make adjustments through the admin workflow.
 *
 * Values are stored in minutes.
 */
export const ATTENDANCE_FINALIZATION_WINDOW_MINUTES = 180;

/**
 * Organization working-hour options
 *
 * Values are stored in minutes.
 */
export const ORGANIZATION_WORKING_HOUR_OPTIONS = [
  {
    value: 240,
    label: "4 hours",
  },
  {
    value: 270,
    label: "4.5 hours",
  },
  {
    value: 300,
    label: "5 hours",
  },
  {
    value: 330,
    label: "5.5 hours",
  },
  {
    value: 360,
    label: "6 hours",
  },
  {
    value: 390,
    label: "6.5 hours",
  },
  {
    value: 420,
    label: "7 hours",
  },
  {
    value: 450,
    label: "7.5 hours",
  },
  {
    value: 480,
    label: "8 hours",
  },
  {
    value: 510,
    label: "8.5 hours",
  },
  {
    value: 540,
    label: "9 hours",
  },
  {
    value: 570,
    label: "9.5 hours",
  },
  {
    value: 600,
    label: "10 hours",
  },
  {
    value: 630,
    label: "10.5 hours",
  },
  {
    value: 660,
    label: "11 hours",
  },
  {
    value: 690,
    label: "11.5 hours",
  },
  {
    value: 720,
    label: "12 hours",
  },
] as const;

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
