"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useState } from "react";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import type { ManageLeave } from "@/types/organization/leave";

import { LeaveTable } from "./LeaveTable";

type ManageLeavesProps = {
  leaves: ManageLeave[];
};

const ManageLeaves = ({ leaves: initialLeaves }: ManageLeavesProps) => {
  const [leaves, setLeaves] = useState<ManageLeave[]>(initialLeaves);

  const handleLeaveStatusChanged = (
    leaveId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setLeaves((current) =>
      current.map((leave) =>
        leave.id === leaveId
          ? {
              ...leave,
              status,
            }
          : leave,
      ),
    );
  };

  const pendingLeaves = leaves.filter((leave) => leave.status === "PENDING");

  if (pendingLeaves.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
        title="No leave requests to manage"
        description="There are no pending leave requests that require your attention."
      />
    );
  }

  return (
    <LeaveTable
      leaves={pendingLeaves}
      view="manage"
      onLeaveStatusChanged={handleLeaveStatusChanged}
    />
  );
};

export default ManageLeaves;
