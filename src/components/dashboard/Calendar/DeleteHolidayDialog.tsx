// components/dashboard/Calendar/DeleteHolidayDialog.tsx

"use client";

import { CalendarDays } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { deleteOrganizationHoliday } from "@/server/organization/deleteOrganizationHoliday";
import { useState } from "react";

export type OrganizationHoliday = {
  id: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};

type DeleteHolidayDialogProps = {
  open: boolean;
  holiday: OrganizationHoliday | null;
  onOpenChange: (open: boolean) => void;
  onHolidayDeleted: (holidayId: string) => void;
};

const formatMonth = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(date));
};

const formatDay = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(new Date(date));
};

const DeleteHolidayDialog = ({
  open,
  holiday,
  onOpenChange,
  onHolidayDeleted,
}: DeleteHolidayDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!holiday) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteOrganizationHoliday(holiday.id);

      if (!result.success) {
        switch (result.code) {
          case "UNAUTHORIZED":
            toast.error("Authentication required", {
              description: result.error || "Please log in and try again.",
            });
            return;

          case "FORBIDDEN":
            toast.error("Permission denied", {
              description:
                result.error ||
                "Only organization owners and admins can delete holidays.",
            });
            return;

          case "ORGANIZATION_NOT_FOUND":
            toast.error("Organization not found", {
              description:
                result.error || "The active organization could not be found.",
            });
            return;

          case "NOT_FOUND":
            toast.error("Holiday not found", {
              description: result.error || "This holiday could not be found.",
            });
            return;

          default:
            toast.error("Unable to delete holiday", {
              description:
                result.error || "Something went wrong. Please try again.",
            });
            return;
        }
      }

      onHolidayDeleted(holiday.id);

      toast.success("Holiday deleted", {
        description: result.message || "The holiday was deleted successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[DeleteHolidayDialog] delete holiday error:", error);

      toast.error("Something went wrong", {
        description: "Unable to delete the holiday. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isDeleting) {
      return;
    }

    onOpenChange(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete holiday?</AlertDialogTitle>

          <AlertDialogDescription>
            This will permanently delete the following holiday from your
            organization calendar. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        {holiday && (
          <div className="rounded-lg">
            <div className="flex items-center gap-3">
              {/* Date */}
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                  {formatMonth(holiday.date)}
                </span>

                <span className="mt-1 text-base font-semibold leading-none">
                  {formatDay(holiday.date)}
                </span>
              </div>

              {/* Holiday */}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{holiday.name}</p>

                {holiday.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {holiday.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-2 flex-row gap-2">
          <AlertDialogCancel disabled={isDeleting} className="mt-0 flex-1">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            className="flex-1"
            disabled={isDeleting || !holiday}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {isDeleting ? (
              <>
                <Spinner className="size-5" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteHolidayDialog;
