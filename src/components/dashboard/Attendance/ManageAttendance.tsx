"use client";

import { CalendarDaysIcon } from "lucide-react";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import type { ManageAttendance } from "@/types/organization/attendance";

import { getAttendanceDetails } from "@/server/attendance/getAttendanceDetails";

import { AttendanceTable } from "./AttendanceTable";

type AttendanceDetailsData = Awaited<ReturnType<typeof getAttendanceDetails>>;

type ManageAttendanceProps = {
  attendance: ManageAttendance[];
  canAdjustAttendance: boolean;
  onAttendanceSaved?: (attendance: AttendanceDetailsData) => void;
};

const ManageAttendance = ({
  attendance,
  canAdjustAttendance,
  onAttendanceSaved,
}: ManageAttendanceProps) => {
  return (
    <>
      {attendance.length > 0 ? (
        <AttendanceTable
          attendance={attendance}
          view="manage"
          onAttendanceSaved={onAttendanceSaved}
        />
      ) : (
        <EmptyState
          icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
          title="No attendance records"
          description="There are no attendance records available for the selected period."
        />
      )}
    </>
  );
};

export default ManageAttendance;
