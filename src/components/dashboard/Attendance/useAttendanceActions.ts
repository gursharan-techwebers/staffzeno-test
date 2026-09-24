"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AttendanceActionState } from "@/types/organization/attendance";

import { punchIn } from "@/server/attendance/punchIn";
import { startBreak } from "@/server/attendance/startBreak";
import { endBreak } from "@/server/attendance/endBreak";
import { punchOut } from "@/server/attendance/punchOut";

type UseAttendanceActionsParams = {
  state: AttendanceActionState;
  organizationId: string;
  memberId: string;
  canPerformSessionActions: boolean;
  onStateChange: (state: AttendanceActionState) => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function useAttendanceActions({
  state,
  organizationId,
  memberId,
  canPerformSessionActions,
  onStateChange,
}: UseAttendanceActionsParams) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  /**
   * ---------------------------------------------------------
   * Punch In
   * ---------------------------------------------------------
   */

  const handlePunchIn = () => {
    if (
      isPending ||
      (state.status !== "NOT_STARTED" && state.status !== "PUNCHED_OUT")
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const nextState = await punchIn({
          organizationId,
          memberId,
        });

        onStateChange(nextState);

        toast.success("You are now punched in.");
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to punch in. Please try again.",
        );

        toast.error(message);

        console.error("[Attendance] Punch in failed:", error);
      }
    });
  };

  /**
   * ---------------------------------------------------------
   * Start Break
   * ---------------------------------------------------------
   */

  const handleStartBreak = () => {
    if (isPending || state.status !== "WORKING" || !canPerformSessionActions) {
      return;
    }

    startTransition(async () => {
      try {
        const nextState = await startBreak({
          attendanceId: state.attendanceId,
          sessionId: state.sessionId,
        });

        onStateChange(nextState);

        toast.success("Break started.");
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to start your break. Please try again.",
        );

        toast.error(message);

        console.error("[Attendance] Start break failed:", error);
      }
    });
  };

  /**
   * ---------------------------------------------------------
   * End Break
   * ---------------------------------------------------------
   */

  const handleEndBreak = () => {
    if (isPending || state.status !== "ON_BREAK") {
      return;
    }

    startTransition(async () => {
      try {
        const nextState = await endBreak({
          attendanceId: state.attendanceId,
          sessionId: state.sessionId,
          breakId: state.breakId,
        });

        onStateChange(nextState);

        toast.success("Break ended. You are back to work.");
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to end your break. Please try again.",
        );

        toast.error(message);

        console.error("[Attendance] End break failed:", error);
      }
    });
  };

  /**
   * ---------------------------------------------------------
   * Punch Out
   * ---------------------------------------------------------
   */

  const handlePunchOut = (workSummary: string) => {
    if (isPending || state.status !== "WORKING" || !canPerformSessionActions) {
      return;
    }

    startTransition(async () => {
      try {
        const nextState = await punchOut({
          attendanceId: state.attendanceId,
          sessionId: state.sessionId,
          workSummary,
          closedBy: "EMPLOYEE",
        });

        onStateChange(nextState);

        toast.success("You have been punched out.");

        router.refresh();
        window.location.reload();
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to punch out. Please try again.",
        );

        toast.error(message);

        console.error("[Attendance] Punch out failed:", error);
      }
    });
  };

  const handleAutomaticPunchOut = () => {
    if (isPending || state.status !== "WORKING") {
      return;
    }

    startTransition(async () => {
      try {
        const nextState = await punchOut({
          attendanceId: state.attendanceId,
          sessionId: state.sessionId,
          workSummary: null,
          closedBy: "SYSTEM",
        });

        onStateChange(nextState);

        toast.success("You have been automatically punched out.");

        router.refresh();
        window.location.reload();
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to automatically punch out. Please try again.",
        );

        toast.error(message);

        console.error("[Attendance] Automatic punch out failed:", error);
      }
    });
  };

  return {
    isPending,
    handlePunchIn,
    handleStartBreak,
    handleEndBreak,
    handlePunchOut,
    handleAutomaticPunchOut,
  };
}
