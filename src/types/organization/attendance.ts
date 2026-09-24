import type {
  AttendanceStatus,
  AttendanceSessionStatus as PrismaAttendanceSessionStatus,
} from "@/generated/prisma/enums";

/**
 * Status of an individual attendance session.
 *
 * ACTIVE:
 *   Employee has punched in and has not punched out yet.
 *
 * COMPLETED:
 *   Employee has successfully punched out.
 *
 * INCOMPLETE:
 *   Session requires attention, for example when a punch-out
 *   is missing or the session crosses the organization day boundary.
 */
export type AttendanceSessionStatus = "ACTIVE" | "COMPLETED" | "INCOMPLETE";

/**
 * Status of an attendance break.
 */
export type AttendanceBreakStatus = "ACTIVE" | "COMPLETED" | "INCOMPLETE";

/**
 * Types of attendance adjustments that can be made
 * by an organization owner/admin.
 */
export type AttendanceAdjustmentType =
  | "ADD_PUNCH_IN"
  | "ADD_PUNCH_OUT"
  | "EDIT_PUNCH_IN"
  | "EDIT_PUNCH_OUT"
  | "ADD_BREAK"
  | "EDIT_BREAK"
  | "DELETE_BREAK"
  | "EDIT_SESSION"
  | "MARK_PRESENT"
  | "MARK_ABSENT";

/**
 * A single work session.
 *
 * One employee can have multiple sessions on the same day.
 *
 * Example:
 *
 * 09:00 → 13:00
 * 14:00 → 18:00
 */
export type AttendanceSession = {
  id: string;

  attendanceDayId: string;
  memberId: string;

  punchIn: Date | string;
  punchOut: Date | string | null;

  status: AttendanceSessionStatus;

  /**
   * Total elapsed session minutes.
   *
   * This represents the session duration before
   * break deductions where applicable.
   */
  workedMinutes: number;

  createdAt: Date | string;
  updatedAt: Date | string;

  breaks: AttendanceBreak[];
};

/**
 * A break taken inside an attendance session.
 */
export type AttendanceBreak = {
  id: string;

  attendanceSessionId: string;
  memberId: string;

  startedAt: Date | string;
  endedAt: Date | string | null;

  status: AttendanceBreakStatus;

  /**
   * Duration of the break in minutes.
   *
   * Null while the break is still active.
   */
  durationMinutes: number | null;

  createdAt: Date | string;
  updatedAt: Date | string;
};

/**
 * An attendance adjustment made by an owner/admin.
 *
 * Adjustments should remain auditable instead of silently
 * overwriting the original employee punch data.
 */
export type AttendanceAdjustment = {
  id: string;

  attendanceDayId: string;

  /**
   * Member whose attendance was adjusted.
   */
  memberId: string;

  /**
   * Member who performed the adjustment.
   */
  adjustedByMemberId: string;

  type: AttendanceAdjustmentType;

  /**
   * Optional reference to the affected session.
   */
  attendanceSessionId: string | null;

  /**
   * Optional reference to the affected break.
   */
  attendanceBreakId: string | null;

  /**
   * Previous value before the adjustment.
   *
   * Kept as a string because an adjustment may contain
   * a timestamp, status, or another serialized value.
   */
  previousValue: string | null;

  /**
   * New value after the adjustment.
   */
  newValue: string | null;

  reason: string;

  createdAt: Date | string;
};

/**
 * Daily attendance summary for one employee.
 *
 * AttendanceDay is the calculated/snapshot representation
 * used by the main attendance list.
 *
 * Raw punch information lives in AttendanceSession and
 * AttendanceBreak.
 */
export type Attendance = {
  id: string;

  organizationId: string;
  memberId: string;

  /**
   * Organization-local calendar date represented by this record.
   */
  date: Date | string;

  /**
   * Timezone used when this attendance day was calculated.
   *
   * Stored so historical attendance remains deterministic
   * if the organization's timezone changes later.
   */
  timezone: string;

  /**
   * Required working time for this particular day,
   * stored as a snapshot.
   */
  requiredMinutes: number;

  /**
   * Total actual working time after break deductions.
   */
  workedMinutes: number;

  /**
   * Minutes counted toward regular working time.
   */
  regularMinutes: number;

  /**
   * Minutes exceeding required working time.
   */
  overtimeMinutes: number;

  /**
   * Minutes below required working time.
   */
  shortfallMinutes: number;

  status: AttendanceStatus;

  /**
   * Whether the attendance day has been finalized.
   *
   * Once finalized, regular employees should not be able
   * to modify the day's attendance.
   */
  isFinalized: boolean;

  /**
   * When the attendance day was finalized.
   */
  finalizedAt: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
};

/**
 * Attendance record used when an owner/admin manages
 * organization-wide attendance.
 *
 * Includes employee/member information but does not
 * automatically include raw sessions/breaks.
 *
 * The main attendance table should remain lightweight.
 * Details can be loaded separately.
 */
export type ManageAttendance = Attendance & {
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
};

export type AttendanceSessionClosedBy = "EMPLOYEE" | "SYSTEM" | "ADMIN";

export type AttendanceActionState =
  | {
      status: "NOT_STARTED";
      attendanceId: string | null;
      workedMinutes: number;
      requiredMinutes: number;
    }
  | {
      status: "WORKING";
      attendanceId: string;
      sessionId: string;
      punchedInAt: string;
      workedMinutes: number;
      requiredMinutes: number;
      regularMinutes: number;
      overtimeMinutes: number;
      shortfallMinutes: number;
    }
  | {
      status: "ON_BREAK";
      attendanceId: string;
      sessionId: string;
      breakId: string;
      breakStartedAt: string;
      punchedInAt: string;
      workedMinutes: number;
      requiredMinutes: number;
      regularMinutes: number;
      overtimeMinutes: number;
      shortfallMinutes: number;
    }
  | {
      status: "PUNCHED_OUT";
      attendanceId: string;
      sessionId: string;
      punchedInAt: string;
      punchedOutAt: string;
      closedBy: AttendanceSessionClosedBy;
      workedMinutes: number;
      requiredMinutes: number;
      regularMinutes: number;
      overtimeMinutes: number;
      shortfallMinutes: number;
    }
  | {
      status: "NOT_WORKING_DAY";
      reason: "WEEKEND" | "HOLIDAY";
    };

// update

export type UpdatedAttendance = {
  id: string;
  date: Date;
  timezone: string;
  requiredMinutes: number;
  workedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  shortfallMinutes: number;
  status: AttendanceStatus;
  isFinalized: boolean;
  finalizedAt: Date | null;

  member: {
    title: string | null;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };

  sessions: {
    id: string;
    sessionNumber: number;
    status: PrismaAttendanceSessionStatus;
    punchedInAt: Date;
    punchedOutAt: Date | null;
    closedBy: AttendanceSessionClosedBy | null;
    totalSessionMinutes: number;
    totalBreakMinutes: number;
    workedMinutes: number;
    workSummary: string | null;

    breaks: {
      id: string;
      startedAt: Date;
      endedAt: Date | null;
      durationMinutes: number;
    }[];
  }[];
};

export type UpdateAttendanceSuccess = {
  attendance: UpdatedAttendance;
};
