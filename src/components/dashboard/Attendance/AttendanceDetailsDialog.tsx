"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { AttendanceDetailsSkeleton } from "./AttendanceDetailsSkeleton";
import {
  AttendanceDetailsContent,
  type AttendanceDetails,
} from "./AttendanceDetailsContent";

type AttendanceDetailsDialogProps = {
  attendance: AttendanceDetails | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttendanceDetailsDialog({
  attendance,
  loading,
  open,
  onOpenChange,
}: AttendanceDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        {loading || !attendance ? (
          <AttendanceDetailsSkeleton />
        ) : (
          <AttendanceDetailsContent attendance={attendance} />
        )}
      </DialogContent>
    </Dialog>
  );
}
