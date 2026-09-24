"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useState } from "react";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import type { Attendance } from "@/types/organization/attendance";
import { AttendanceTable } from "./AttendanceTable";


type MyAttendanceProps = {
  attendance: Attendance[];
};

const MyAttendance = ({
  attendance: initialAttendance,
}: MyAttendanceProps) => {
  const [attendance] =
    useState<Attendance[]>(initialAttendance);

  return (
    <>
      {attendance.length > 0 ? (
        <AttendanceTable
          attendance={attendance}
          view="my"
        />
      ) : (
        <EmptyState
          icon={
            <CalendarDaysIcon className="size-6 text-muted-foreground" />
          }
          title="No attendance records"
          description="You don't have any attendance records yet. Your attendance will appear here once you start recording your work time."
        />
      )}
    </>
  );
};

export default MyAttendance;