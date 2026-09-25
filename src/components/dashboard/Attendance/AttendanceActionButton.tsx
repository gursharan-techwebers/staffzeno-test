"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Clock3, Coffee, LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";

import { ATTENDANCE_CONSTANTS } from "@/constants/organization";
import type { AttendanceActionState } from "@/types/organization/attendance";

import { useAttendanceActions } from "./useAttendanceActions";
import { Duration, SessionAvailability, StatusDot } from "./StatusDot";
import { MetricRow, PopoverMetrics, PopoverStatus } from "./Popover";
import { getElapsedSeconds } from "./util";
import AttendanceRequiredConfirmation from "./AttendanceRequiredConfirmation";
import { PunchOutSummaryDialog } from "./PunchOutSummaryDialog";

type AttendanceActionButtonProps = {
  initialState: AttendanceActionState;
  organizationId: string;
  memberId: string;
};

export default function AttendanceActionButton({
  initialState,
  organizationId,
  memberId,
}: AttendanceActionButtonProps) {
  const [state, setState] = useState<AttendanceActionState>(initialState);

  const [isPunchOutDialogOpen, setIsPunchOutDialogOpen] = useState(false);

  /**
   * ---------------------------------------------------------
   * Live working timer
   * ---------------------------------------------------------
   *
   * Initialized to 0 so the first client render matches
   * the server render and avoids hydration mismatches.
   */

  const [workingSeconds, setWorkingSeconds] = useState(0);

  const [showRequiredConfirmation, setShowRequiredConfirmation] =
    useState(false);

  /**
   * Prevent the required-hours confirmation from opening
   * repeatedly during the same working session.
   */
  const requiredConfirmationShownRef = useRef(false);

  /**
   * Prevent automatic punch out from firing more than once.
   */
  const autoPunchOutTriggeredRef = useRef(false);

  /**
   * ---------------------------------------------------------
   * Synchronize client state with server state
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setState(initialState);

    if (initialState.status !== "WORKING") {
      requiredConfirmationShownRef.current = false;
      autoPunchOutTriggeredRef.current = false;
      setShowRequiredConfirmation(false);
      setWorkingSeconds(0);
    }
  }, [initialState]);

  /**
   * ---------------------------------------------------------
   * Live working timer
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (state.status !== "WORKING" || !state.punchedInAt) {
      return;
    }

    const updateWorkingTime = () => {
      setWorkingSeconds(getElapsedSeconds(state.punchedInAt));
    };

    updateWorkingTime();

    const interval = window.setInterval(updateWorkingTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [state.status, state.punchedInAt]);

  /**
   * ---------------------------------------------------------
   * Required working time
   * ---------------------------------------------------------
   */

  const requiredWorkingSeconds =
    state.status === "WORKING" ? state.requiredMinutes * 60 : 0;

  const hasReachedRequiredHours =
    state.status === "WORKING" && workingSeconds >= requiredWorkingSeconds;

  /**
   * ---------------------------------------------------------
   * Minimum session duration
   * ---------------------------------------------------------
   */

  const minimumSessionSeconds = ATTENDANCE_CONSTANTS.minimumSessionMinutes * 60;

  const canPerformSessionActions =
    state.status === "WORKING" && workingSeconds >= minimumSessionSeconds;

  const minimumSessionRemainingSeconds =
    state.status === "WORKING"
      ? Math.max(0, minimumSessionSeconds - workingSeconds)
      : 0;

  /**
   * ---------------------------------------------------------
   * Attendance actions
   * ---------------------------------------------------------
   */

  const {
    isPending,
    handlePunchIn,
    handleStartBreak,
    handleEndBreak,
    handlePunchOut,
    handleAutomaticPunchOut,
  } = useAttendanceActions({
    state,
    organizationId,
    memberId,
    canPerformSessionActions,
    onStateChange: setState,
  });

  /**
   * ---------------------------------------------------------
   * Required-hours confirmation
   * ---------------------------------------------------------
   *
   * Once the employee reaches the required time:
   *
   * - Show the confirmation once.
   * - Allow the employee to continue working.
   * - Allow manual punch out.
   * - Automatically punch out after 5 minutes if
   *   no action is taken.
   */

  useEffect(() => {
    if (!hasReachedRequiredHours) {
      return;
    }

    if (requiredConfirmationShownRef.current) {
      return;
    }

    requiredConfirmationShownRef.current = true;
    autoPunchOutTriggeredRef.current = false;

    setShowRequiredConfirmation(true);
  }, [hasReachedRequiredHours]);

  /**
   * ---------------------------------------------------------
   * Required-hours confirmation punch-out
   * ---------------------------------------------------------
   */

  const handleRequiredConfirmationAutomaticPunchOut = useCallback(() => {
    setShowRequiredConfirmation(false);

    if (autoPunchOutTriggeredRef.current) {
      return;
    }

    autoPunchOutTriggeredRef.current = true;

    handleAutomaticPunchOut();
  }, [handleAutomaticPunchOut]);

  const handleRequiredConfirmationManualPunchOut = useCallback(() => {
    setShowRequiredConfirmation(false);
    setIsPunchOutDialogOpen(true);
  }, []);

  /**
   * ---------------------------------------------------------
   * Header trigger
   * ---------------------------------------------------------
   */

  const renderTriggerContent = () => {
    switch (state.status) {
      case "NOT_STARTED":
        return (
          <>
            <StatusDot variant="neutral" />
            <span>Not Started</span>
          </>
        );

      case "WORKING":
        return (
          <>
            <StatusDot variant="working" />

            <span>Working</span>

            <Duration
              seconds={workingSeconds}
              className="text-sm text-muted-foreground"
            />
          </>
        );

      case "ON_BREAK":
        return (
          <>
            <StatusDot variant="break" />
            <span>On Break</span>
          </>
        );

      case "PUNCHED_OUT":
        return (
          <>
            <StatusDot
              variant={state.closedBy === "SYSTEM" ? "warning" : "neutral"}
            />

            <span>
              {state.closedBy === "SYSTEM"
                ? "Automatically Punched Out"
                : "Punched Out"}
            </span>
          </>
        );

      case "NOT_WORKING_DAY":
        return (
          <>
            <StatusDot variant="neutral" />

            <span>{state.reason === "WEEKEND" ? "Weekend" : "Holiday"}</span>
          </>
        );

      default:
        return null;
    }
  };

  /**
   * ---------------------------------------------------------
   * Popover content
   * ---------------------------------------------------------
   */

  const renderPopoverContent = () => {
    /**
     * NOT STARTED
     */

    if (state.status === "NOT_STARTED") {
      return (
        <div className="space-y-4">
          <PopoverStatus
            dot="neutral"
            title="Not Started"
            description="Start your attendance to begin tracking your work time."
          />

          <Button
            type="button"
            className="w-full"
            onClick={handlePunchIn}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : <LogIn className="mr-0.5 size-4" />}

            {isPending ? "Punching In..." : "Punch In"}
          </Button>
        </div>
      );
    }

    /**
     * WORKING
     */

    if (state.status === "WORKING") {
      const hasShortfall = state.shortfallMinutes > 0;
      const hasOvertime = state.overtimeMinutes > 0;

      return (
        <div className="space-y-4">
          <PopoverStatus
            dot="working"
            title="Working"
            description="Your current work session is active."
          />

          <PopoverMetrics>
            <MetricRow
              label="Worked"
              value={<Duration seconds={workingSeconds} />}
              emphasize
            />

            {hasShortfall && (
              <MetricRow
                label="Remaining"
                value={<Duration seconds={state.shortfallMinutes * 60} />}
              />
            )}

            {hasOvertime && (
              <MetricRow
                label="Overtime"
                value={<Duration seconds={state.overtimeMinutes * 60} />}
              />
            )}
          </PopoverMetrics>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleStartBreak}
                disabled={isPending || !canPerformSessionActions}
              >
                {isPending ? <Spinner /> : <Coffee className="mr-0.5 size-4" />}

                {isPending ? "Please wait..." : "Start Break"}
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => setIsPunchOutDialogOpen(true)}
                disabled={isPending || !canPerformSessionActions}
              >
                {isPending ? <Spinner /> : <LogOut className="mr-0.5 size-4" />}

                {isPending ? "Please wait..." : "Punch Out"}
              </Button>
            </div>

            {!canPerformSessionActions && (
              <SessionAvailability
                remainingSeconds={minimumSessionRemainingSeconds}
                totalSeconds={minimumSessionSeconds}
              />
            )}
          </div>
        </div>
      );
    }

    /**
     * ON BREAK
     */

    if (state.status === "ON_BREAK") {
      const hasShortfall = state.shortfallMinutes > 0;
      const hasOvertime = state.overtimeMinutes > 0;

      return (
        <div className="space-y-4">
          <PopoverStatus
            dot="break"
            title="On Break"
            description="Your work session is paused."
          />

          <PopoverMetrics>
            <MetricRow
              label="Worked"
              value={<Duration seconds={state.workedMinutes * 60} />}
              emphasize
            />

            {hasShortfall && (
              <MetricRow
                label="Remaining"
                value={<Duration seconds={state.shortfallMinutes * 60} />}
              />
            )}

            {hasOvertime && (
              <MetricRow
                label="Overtime"
                value={<Duration seconds={state.overtimeMinutes * 60} />}
              />
            )}
          </PopoverMetrics>

          <Button
            type="button"
            className="w-full"
            onClick={handleEndBreak}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : <Clock3 className="mr-0.5 size-4" />}

            {isPending ? "Ending..." : "End Break"}
          </Button>
        </div>
      );
    }

    /**
     * PUNCHED OUT
     */

    if (state.status === "PUNCHED_OUT") {
      const hasShortfall = state.shortfallMinutes > 0;
      const hasOvertime = state.overtimeMinutes > 0;
      const wasSystemClosed = state.closedBy === "SYSTEM";

      return (
        <div className="space-y-4">
          <PopoverStatus
            dot={wasSystemClosed ? "warning" : "neutral"}
            title={
              wasSystemClosed
                ? "Automatically Punched Out"
                : hasShortfall
                  ? "Attendance Incomplete"
                  : "Punched Out"
            }
            description={
              wasSystemClosed
                ? "You didn't punch out. The system automatically closed your work session."
                : hasShortfall
                  ? "You can punch in again to continue working today."
                  : "You punched out successfully."
            }
          />

          <PopoverMetrics>
            <MetricRow
              label="Worked"
              value={<Duration seconds={state.workedMinutes * 60} />}
              emphasize
            />

            {hasShortfall && (
              <MetricRow
                label="Remaining"
                value={<Duration seconds={state.shortfallMinutes * 60} />}
              />
            )}

            {hasOvertime && (
              <MetricRow
                label="Overtime"
                value={<Duration seconds={state.overtimeMinutes * 60} />}
              />
            )}
          </PopoverMetrics>

          {/* 
            Punch in remains available after punch out.
            This intentionally does NOT restrict the employee
            from starting another session.
          */}
          <Button
            type="button"
            variant={hasShortfall ? "default" : "outline"}
            className="w-full"
            onClick={handlePunchIn}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : <LogIn className="mr-0.5 size-4" />}

            {isPending
              ? "Punching In..."
              : hasShortfall
                ? "Punch In Again"
                : "Punch In for Overtime"}
          </Button>
        </div>
      );
    }

    /**
     * WEEKEND / HOLIDAY
     */

    if (state.status === "NOT_WORKING_DAY") {
      const isWeekend = state.reason === "WEEKEND";

      return (
        <div className="py-1">
          <PopoverStatus
            dot="neutral"
            title={isWeekend ? "Weekend" : "Holiday"}
            description={
              isWeekend
                ? "Attendance is not required today."
                : "Today is a holiday. Attendance is not required."
            }
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-2 rounded-lg px-3"
          >
            {renderTriggerContent()}

            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="relative w-85 overflow-hidden p-4"
        >
          {renderPopoverContent()}
        </PopoverContent>
      </Popover>

      <AttendanceRequiredConfirmation
        open={showRequiredConfirmation}
        onOpenChange={setShowRequiredConfirmation}
        workedMinutes={
          state.status === "WORKING" ? Math.floor(workingSeconds / 60) : 0
        }
        requiredMinutes={state.status === "WORKING" ? state.requiredMinutes : 0}
        onManualPunchOut={handleRequiredConfirmationManualPunchOut}
        onAutomaticPunchOut={handleRequiredConfirmationAutomaticPunchOut}
      />

      <PunchOutSummaryDialog
        open={isPunchOutDialogOpen}
        onOpenChange={setIsPunchOutDialogOpen}
        isPending={isPending}
        onConfirm={(workSummary) => {
          handlePunchOut(workSummary);
        }}
      />
    </>
  );
}
