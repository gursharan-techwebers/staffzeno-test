import type { LeaveTypeId } from "@/constants/leave";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type LeaveDuration =
  "FULL_DAY" | "MULTIPLE_DAYS" | "HALF_DAY" | "SHORT_LEAVE";

export const LEAVE_DURATIONS: Record<
  LeaveDuration,
  {
    id: LeaveDuration;
    name: string;
  }
> = {
  FULL_DAY: {
    id: "FULL_DAY",
    name: "Full Day",
  },

  MULTIPLE_DAYS: {
    id: "MULTIPLE_DAYS",
    name: "Multiple Days",
  },

  HALF_DAY: {
    id: "HALF_DAY",
    name: "Half Day",
  },

  SHORT_LEAVE: {
    id: "SHORT_LEAVE",
    name: "Short Leave",
  },
};

export type HalfDayPeriod = "FIRST_HALF" | "SECOND_HALF";

export type Leave = {
  id: string;

  organizationId: string;
  memberId: string;

  /**
   * Static leave type ID.
   *
   * Examples:
   * sick
   * casual
   * emergency
   * vacation
   */
  leaveType: LeaveTypeId;

  startDate: Date | string;
  endDate: Date | string;

  duration: LeaveDuration;
  halfDayPeriod: HalfDayPeriod | null;

  startTime: string | null;
  endTime: string | null;

  requestedMinutes: number;

  reason: string;

  status: LeaveStatus;

  createdAt: Date | string;
  updatedAt: Date | string;
};

export type ManageLeave = Leave & {
  member: {
    id: string;
    userId: string;
    role: string;
    title: string | null;

    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };

  approvals: {
    id: string;
    approverMemberId: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    comment: string | null;
    actedAt: Date | null;
  }[];
};
