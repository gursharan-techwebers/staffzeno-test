"use client";

import {
  BanIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import type { Leave, ManageLeave } from "@/types/organization/leave";

import { cancelLeaveRequest } from "@/server/leave/cancelLeaveRequest";
import { manageLeaveRequest } from "@/server/leave/manageLeaveRequest";
import { formatLeaveDuration } from "@/lib/utils/formatLeaveDuration";
import { formatDate } from "@/lib/utils/date";

type LeaveAction = "CANCEL" | "APPROVE" | "REJECT";

type LeaveActionDialogProps = {
  open: boolean;
  leave: Leave | ManageLeave | null;
  action: LeaveAction | null;
  onOpenChange: (open: boolean) => void;
  onLeaveCancelled?: (leaveId: string) => void;
  onLeaveStatusChanged?: (
    leaveId: string,
    status: "APPROVED" | "REJECTED",
  ) => void;
};

const formatDateRange = (startDate: Date | string, endDate: Date | string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
};

const getActionConfig = (action: LeaveAction | null) => {
  switch (action) {
    case "APPROVE":
      return {
        title: "Approve leave request?",
        description:
          "This will approve the leave request. The employee will be marked as approved for the requested leave period.",
        buttonLabel: "Approve Leave",
        loadingLabel: "Approving...",
        successTitle: "Leave request approved",
        successDescription: "The leave request has been approved successfully.",
        icon: CheckCircle2Icon,
        variant: "default" as const,
      };

    case "REJECT":
      return {
        title: "Reject leave request?",
        description:
          "This will reject the leave request. Please provide a reason for the rejection.",
        buttonLabel: "Reject Leave",
        loadingLabel: "Rejecting...",
        successTitle: "Leave request rejected",
        successDescription: "The leave request has been rejected successfully.",
        icon: XCircleIcon,
        variant: "destructive" as const,
      };

    case "CANCEL":
      return {
        title: "Cancel leave request?",
        description:
          "This will cancel your pending leave request. This action cannot be undone.",
        buttonLabel: "Cancel Leave",
        loadingLabel: "Cancelling...",
        successTitle: "Leave request cancelled",
        successDescription:
          "Your leave request has been cancelled successfully.",
        icon: BanIcon,
        variant: "destructive" as const,
      };

    default:
      return null;
  }
};

const LeaveActionDialog = ({
  open,
  leave,
  action,
  onOpenChange,
  onLeaveCancelled,
  onLeaveStatusChanged,
}: LeaveActionDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState("");

  const config = getActionConfig(action);

  useEffect(() => {
    if (!open || action !== "REJECT") {
      setComment("");
    }
  }, [open, action]);

  const handleAction = async () => {
    if (!leave || !action || isProcessing) {
      return;
    }

    const trimmedComment = comment.trim();

    if (action === "REJECT" && !trimmedComment) {
      toast.error("Rejection reason required", {
        description:
          "Please provide a reason for rejecting this leave request.",
      });

      return;
    }

    setIsProcessing(true);

    try {
      if (action === "CANCEL") {
        const result = await cancelLeaveRequest({
          leaveId: leave.id,
        });

        if (!result.success) {
          toast.error("Unable to cancel leave", {
            description:
              result.error ||
              result.message ||
              "The leave request could not be cancelled.",
          });

          return;
        }

        onLeaveCancelled?.(leave.id);

        toast.success(config?.successTitle || "Leave request cancelled", {
          description:
            result.message ||
            config?.successDescription ||
            "The leave request has been cancelled successfully.",
        });

        onOpenChange(false);

        return;
      }

      const result = await manageLeaveRequest({
        leaveId: leave.id,
        action,
        comment: action === "REJECT" ? trimmedComment : undefined,
      });

      if (!result.success) {
        toast.error(
          action === "APPROVE"
            ? "Unable to approve leave"
            : "Unable to reject leave",
          {
            description:
              result.error ||
              result.message ||
              "The leave request could not be processed.",
          },
        );

        return;
      }

      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

      onLeaveStatusChanged?.(leave.id, newStatus);

      toast.success(config?.successTitle || "Leave request updated", {
        description:
          result.message ||
          config?.successDescription ||
          "The leave request has been updated successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error(
        `[LeaveActionDialog] ${action.toLowerCase()} leave error:`,
        error,
      );

      toast.error(
        action === "CANCEL"
          ? "Unable to cancel leave"
          : action === "APPROVE"
            ? "Unable to approve leave"
            : "Unable to reject leave",
        {
          description: "Something went wrong. Please try again.",
        },
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isProcessing) {
      return;
    }

    onOpenChange(value);
  };

  if (!config) {
    return null;
  }

  const ActionIcon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {config.title}
          </AlertDialogTitle>

          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        {leave && (
          <div className="rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                <CalendarDaysIcon className="mb-0.5 size-4 text-muted-foreground" />

                <span className="sr-only">
                  {formatDateRange(leave.startDate, leave.endDate)}
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {formatDateRange(leave.startDate, leave.endDate)}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {formatLeaveDuration({
                    duration: leave.duration,
                    halfDayPeriod: leave.halfDayPeriod,
                    startTime: leave.startTime,
                    endTime: leave.endTime,
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                  })}
                </p>
              </div>
            </div>

            {"member" in leave && (
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Employee
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="mt-1 text-sm font-medium">
                    {leave.member.user.name}
                  </p>

                  <Badge variant="outline">
                    {leave.member.title || leave.member.user.email}
                  </Badge>
                </div>
              </div>
            )}

            {leave.reason && (
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Reason
                </p>

                <p className="mt-1 text-sm">{leave.reason}</p>
              </div>
            )}

            {action === "REJECT" && (
              <div className="mt-3">
                <label
                  htmlFor="rejection-comment"
                  className="text-sm font-medium"
                >
                  Reason for rejection
                </label>

                <Textarea
                  id="rejection-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Enter the reason for rejecting this leave request..."
                  className="mt-2 resize-none bg-background border border-border"
                  rows={4}
                  maxLength={1000}
                  disabled={isProcessing}
                />

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    This reason will be visible to the employee.
                  </p>

                  <span className="text-xs text-muted-foreground">
                    {comment.length}/1000
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="mt-2 flex-row gap-2">
          <AlertDialogCancel disabled={isProcessing} className="mt-0 flex-1">
            Keep Leave
          </AlertDialogCancel>

          <AlertDialogAction
            variant={config.variant}
            className="flex-1"
            disabled={
              isProcessing || !leave || (action === "REJECT" && !comment.trim())
            }
            onClick={(event) => {
              event.preventDefault();
              void handleAction();
            }}
          >
            {isProcessing ? (
              <>
                <Spinner className="size-5" />
                {config.loadingLabel}
              </>
            ) : (
              config.buttonLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveActionDialog;
