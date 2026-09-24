"use client";

import { useEffect, useState } from "react";

import { ATTENDANCE_VIEW_STORAGE_KEY } from "@/constants/organization";

import type {
  Attendance,
  ManageAttendance as ManageAttendanceType,
} from "@/types/organization/attendance";

import { DashboardPageHeader } from "../dashboardPageHeader";
import ManageAttendance from "./ManageAttendance";
import MyAttendance from "./MyAttendance";
import AttendanceViewSelector, {
  AttendanceView,
} from "./AttendanceViewSelector";
import { getAttendanceDetails } from "@/server/attendance/getAttendanceDetails";

type AttendanceDetailsData = Awaited<ReturnType<typeof getAttendanceDetails>>;

type AttendanceContentProps = {
  myAttendance: Attendance[];
  manageableAttendance: ManageAttendanceType[];
  canManageAttendance: boolean;
  canConfigureAttendance: boolean;
  canAdjustAttendance: boolean;
};

const isValidAttendanceView = (
  value: string | null,
): value is AttendanceView => {
  return value === "manage-attendance" || value === "my-attendance";
};

const AttendanceContent = ({
  myAttendance,
  manageableAttendance: initialManageableAttendance,
  canManageAttendance,
  canConfigureAttendance,
  canAdjustAttendance,
}: AttendanceContentProps) => {
  /**
   * Local manageable attendance state.
   *
   * This allows the attendance table to update immediately
   * after an attendance record is successfully edited.
   */
  const [manageableAttendance, setManageableAttendance] = useState(
    initialManageableAttendance,
  );

  const defaultView: AttendanceView = canManageAttendance
    ? "manage-attendance"
    : "my-attendance";

  const canSwitchViews = canManageAttendance;

  const [activeView, setActiveView] = useState<AttendanceView>(defaultView);

  const [hasRestoredView, setHasRestoredView] = useState(false);

  /**
   * Keep local attendance state synchronized with
   * attendance data received from the server.
   *
   * This is useful when the page is refreshed or when
   * Next.js provides new server-rendered props.
   */
  useEffect(() => {
    setManageableAttendance(initialManageableAttendance);
  }, [initialManageableAttendance]);

  /**
   * Restore the user's last selected attendance view.
   */
  useEffect(() => {
    const storedView = localStorage.getItem(ATTENDANCE_VIEW_STORAGE_KEY);

    if (canSwitchViews && isValidAttendanceView(storedView)) {
      setActiveView(storedView);
    } else {
      setActiveView(defaultView);

      localStorage.setItem(ATTENDANCE_VIEW_STORAGE_KEY, defaultView);
    }

    setHasRestoredView(true);
  }, [canSwitchViews, defaultView]);

  /**
   * Change attendance view and persist it.
   */
  const handleViewChange = (view: AttendanceView) => {
    setActiveView(view);

    localStorage.setItem(ATTENDANCE_VIEW_STORAGE_KEY, view);
  };

  /**
   * Update the attendance table immediately after
   * an attendance record has been successfully edited.
   *
   * The server action returns the complete updated
   * attendance record, so there is no need to refetch
   * the entire attendance list.
   */
  const handleAttendanceSaved = (updatedAttendance: AttendanceDetailsData) => {
    setManageableAttendance((currentAttendance) =>
      currentAttendance.map((attendance) => {
        if (attendance.id !== updatedAttendance.id) {
          return attendance;
        }

        return {
          ...attendance,
          requiredMinutes: updatedAttendance.requiredMinutes,
          workedMinutes: updatedAttendance.workedMinutes,
          regularMinutes: updatedAttendance.regularMinutes,
          overtimeMinutes: updatedAttendance.overtimeMinutes,
          shortfallMinutes: updatedAttendance.shortfallMinutes,
          status: updatedAttendance.status,
          isFinalized: updatedAttendance.isFinalized,
          finalizedAt: updatedAttendance.finalizedAt,
        };
      }),
    );
  };

  /**
   * Prevent rendering the wrong view while localStorage
   * is being restored.
   */
  if (!hasRestoredView) {
    return null;
  }

  return (
    <div className="space-y-6 md:space-y-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          {activeView === "manage-attendance" ? (
            <DashboardPageHeader
              title="Manage Attendance"
              description="Review and manage employee attendance."
            />
          ) : (
            <DashboardPageHeader
              title="My Attendance"
              description="View your attendance, working hours, and attendance status."
            />
          )}
        </div>

        {canSwitchViews && (
          <div className="shrink-0">
            <AttendanceViewSelector
              value={activeView}
              onValueChange={handleViewChange}
            />
          </div>
        )}
      </div>

      {activeView === "manage-attendance" && canManageAttendance && (
        <ManageAttendance
          attendance={manageableAttendance}
          canAdjustAttendance={canAdjustAttendance}
          onAttendanceSaved={handleAttendanceSaved}
        />
      )}

      {activeView === "my-attendance" && (
        <MyAttendance attendance={myAttendance} />
      )}
    </div>
  );
};

export default AttendanceContent;
