"use client";

import { useEffect, useState } from "react";
import { Clock3, LogOut } from "lucide-react";

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

import { formatDuration } from "./util";
import { AUTO_PUNCH_OUT_SECONDS } from "@/constants/organization";

type AttendanceRequiredConfirmationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workedMinutes: number;
  requiredMinutes: number;
  onManualPunchOut: () => void;
  onAutomaticPunchOut: () => void;
};

export default function AttendanceRequiredConfirmation({
  open,
  onOpenChange,
  workedMinutes,
  requiredMinutes,
  onManualPunchOut,
  onAutomaticPunchOut,
}: AttendanceRequiredConfirmationProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    AUTO_PUNCH_OUT_SECONDS,
  );

  /**
   * Reset the countdown every time the dialog opens.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setRemainingSeconds(AUTO_PUNCH_OUT_SECONDS);

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [open]);

  /**
   * Automatically punch out when the countdown reaches zero.
   */
  useEffect(() => {
    if (!open || remainingSeconds !== 0) {
      return;
    }

    onAutomaticPunchOut();
  }, [open, remainingSeconds, onAutomaticPunchOut]);

  const overtimeMinutes = Math.max(workedMinutes - requiredMinutes, 0);

  const countdownMinutes = Math.floor(remainingSeconds / 60);

  const countdownSeconds = remainingSeconds % 60;

  const formattedCountdown = `${countdownMinutes}:${countdownSeconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg!">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />
            Required hours reached
          </AlertDialogTitle>

          <AlertDialogDescription>
            You have completed your required working hours. You can punch out
            now or continue working to earn overtime.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Worked</span>

            <span className="font-medium tabular-nums">
              {formatDuration(workedMinutes * 60)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required</span>

            <span className="font-medium tabular-nums">
              {formatDuration(requiredMinutes * 60)}
            </span>
          </div>

          {overtimeMinutes > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overtime</span>

              <span className="font-medium tabular-nums">
                {formatDuration(overtimeMinutes * 60)}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Automatic punch out</p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                If you do not choose an option, you will be automatically
                punched out.
              </p>
            </div>

            <span className="shrink-0 text-lg font-semibold tabular-nums">
              {formattedCountdown}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Continue Working</AlertDialogCancel>

          <AlertDialogAction onClick={onManualPunchOut} className="gap-1.5">
            <LogOut className="size-4" />
            Punch Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
