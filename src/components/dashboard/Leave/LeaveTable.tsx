"use client";

import {
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  MoreHorizontalIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import { LEAVE_TYPES } from "@/constants/leave";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import UserNameAndTitle from "@/components/shared/dashboard/UserNameAndTitle";
import { UserProfile } from "../UserProfile";

import LeaveActionDialog from "./LeaveActionDialog";

import type {
  HalfDayPeriod,
  Leave,
  LeaveDuration,
  LeaveStatus,
  ManageLeave,
} from "@/types/organization/leave";
import { formatLeaveDuration } from "@/lib/utils/formatLeaveDuration";
import { formatDate } from "@/lib/utils/date";
import { createStatusConfig } from "@/lib/utils/status";

type LeaveTableProps =
  | {
      leaves: Leave[];
      view: "my";
      onLeaveCancelled?: (leaveId: string) => void;
      onLeaveStatusChanged?: never;
    }
  | {
      leaves: ManageLeave[];
      view: "manage";
      onLeaveCancelled?: never;
      onLeaveStatusChanged?: (
        leaveId: string,
        status: "APPROVED" | "REJECTED",
      ) => void;
    };

type LeaveAction = "CANCEL" | "APPROVE" | "REJECT";

const formatDateRange = (startDate: Date | string, endDate: Date | string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
};

const getLeaveStatusConfig = (status: LeaveStatus) => {
  switch (status) {
    case "PENDING":
      return createStatusConfig("Pending", "warning");

    case "APPROVED":
      return createStatusConfig("Approved", "success");

    case "REJECTED":
      return createStatusConfig("Rejected", "danger");

    case "CANCELLED":
      return createStatusConfig("Cancelled", "neutral");

    default:
      return createStatusConfig(status, "neutral");
  }
};

export function LeaveTable({
  leaves,
  view,
  onLeaveCancelled,
  onLeaveStatusChanged,
}: LeaveTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  const [actionLeave, setActionLeave] = useState<Leave | ManageLeave | null>(
    null,
  );

  const [action, setAction] = useState<LeaveAction | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const isManageView = view === "manage";

  const handleActionClick = (
    leave: Leave | ManageLeave,
    action: LeaveAction,
  ) => {
    setActionLeave(leave);
    setAction(action);
    setActionDialogOpen(true);
  };

  const handleActionDialogOpenChange = (open: boolean) => {
    setActionDialogOpen(open);

    if (!open) {
      setActionLeave(null);
      setAction(null);
      setActionId(null);
    }
  };

  const handleLeaveCancelled = (leaveId: string) => {
    onLeaveCancelled?.(leaveId);

    setActionLeave(null);
    setAction(null);
  };

  const handleLeaveStatusChanged = (
    leaveId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    onLeaveStatusChanged?.(leaveId, status);

    setActionLeave(null);
    setAction(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {isManageView && (
                <TableHead className="font-medium">Employee</TableHead>
              )}

              <TableHead className="font-medium">Leave Type</TableHead>

              <TableHead className="font-medium">Date</TableHead>

              <TableHead className="font-medium">Duration</TableHead>

              <TableHead className="font-medium">Reason</TableHead>

              <TableHead className="font-medium">Status</TableHead>

              <TableHead className="font-medium">Applied</TableHead>

              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {leaves.map((leave) => {
              const status = getLeaveStatusConfig(leave.status);
              const StatusIcon = status.icon;

              const leaveType = LEAVE_TYPES[leave.leaveType];

              const isPending = leave.status === "PENDING";

              const isActionLoading = actionId === leave.id;

              const duration = formatLeaveDuration({
                duration: leave.duration,
                halfDayPeriod: leave.halfDayPeriod,
                startTime: leave.startTime,
                endTime: leave.endTime,
                startDate: leave.startDate,
                endDate: leave.endDate,
              });

              const isManageLeave = view === "manage";

              return (
                <TableRow
                  key={leave.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  {isManageLeave && "member" in leave && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserProfile
                          user={leave.member.user}
                          title={leave.member.title}
                        />

                        <UserNameAndTitle
                          name={leave.member.user.name}
                          title={leave.member.title || leave.member.user.email}
                        />
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="font-medium">
                    {leaveType?.name ?? leave.leaveType}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {duration}
                  </TableCell>

                  <TableCell className="max-w-60">
                    <span
                      className="block truncate text-muted-foreground"
                      title={leave.reason}
                    >
                      {leave.reason}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 font-medium ${status.className}`}
                    >
                      <StatusIcon className="size-3.5" />

                      {status.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatDate(leave.createdAt)}
                  </TableCell>

                  <TableCell>
                    {isPending && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={isActionLoading}
                          >
                            <MoreHorizontalIcon className="size-4" />

                            <span className="sr-only">Open leave actions</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {isManageLeave ? (
                            <>
                              <DropdownMenuItem
                                disabled={isActionLoading}
                                onClick={() =>
                                  handleActionClick(leave, "APPROVE")
                                }
                              >
                                <CheckCircle2Icon className="size-4" />
                                Approve leave
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                variant="destructive"
                                disabled={isActionLoading}
                                onClick={() =>
                                  handleActionClick(leave, "REJECT")
                                }
                              >
                                <XCircleIcon className="size-4" />
                                Reject leave
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={isActionLoading}
                              onClick={() => handleActionClick(leave, "CANCEL")}
                            >
                              <XCircleIcon className="size-4" />
                              Cancel leave
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <LeaveActionDialog
        open={actionDialogOpen}
        leave={actionLeave}
        action={action}
        onOpenChange={handleActionDialogOpenChange}
        onLeaveCancelled={handleLeaveCancelled}
        onLeaveStatusChanged={handleLeaveStatusChanged}
      />
    </>
  );
}
