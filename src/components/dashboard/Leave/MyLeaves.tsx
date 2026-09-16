"use client";

import { CalendarDaysIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import type { Leave } from "@/types/organization/leave";

import LeaveRequestDialog from "./LeaveRequestDialog";
import { LeaveTable } from "./LeaveTable";

type MyLeavesProps = {
  leaves: Leave[];
  leaveDialogOpen: boolean;
  onLeaveDialogOpenChange: (open: boolean) => void;
};

const MyLeaves = ({
  leaves: initialLeaves,
  leaveDialogOpen,
  onLeaveDialogOpenChange,
}: MyLeavesProps) => {
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves);

  const handleLeaveCreated = (leave: Leave) => {
    setLeaves((current) => [leave, ...current]);
  };

  const handleLeaveCancelled = (leaveId: string) => {
    setLeaves((current) =>
      current.map((leave) =>
        leave.id === leaveId
          ? {
              ...leave,
              status: "CANCELLED",
            }
          : leave,
      ),
    );
  };

  return (
    <>
      {leaves.length > 0 ? (
        <LeaveTable
          leaves={leaves}
          view="my"
          onLeaveCancelled={handleLeaveCancelled}
        />
      ) : (
        <EmptyState
          icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
          title="No leave requests"
          description="You don't have any leave requests yet. Apply for leave when you need time away from work."
          actionIcon={<PlusIcon className="size-4" />}
          actionLabel="Apply for leave"
          onAction={() => onLeaveDialogOpenChange(true)}
        />
      )}

      <LeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={onLeaveDialogOpenChange}
        onLeaveCreated={handleLeaveCreated}
      />
    </>
  );
};

export default MyLeaves;
