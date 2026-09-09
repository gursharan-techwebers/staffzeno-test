"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { updateOrganizationHoliday } from "@/server/organization/updateOrganizationHoliday";

type OrganizationHoliday = {
  id: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};

type EditHolidayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: OrganizationHoliday;
  onHolidayUpdated: (holiday: OrganizationHoliday) => void;
};

const formatDateForInput = (date: Date) => {
  const parsedDate = new Date(date);

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const EditHolidayDialog = ({
  open,
  onOpenChange,
  holiday,
  onHolidayUpdated,
}: EditHolidayDialogProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);

  /*
   * Prefill form with the holiday selected for editing.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setName(holiday.name);
    setDate(formatDateForInput(holiday.date));
    setDescription(holiday.description ?? "");
  }, [open, holiday]);

  /*
   * Update holiday.
   */
  const handleUpdateHoliday = async () => {
    if (!name.trim()) {
      toast.error("Holiday name is required", {
        description: "Please enter a name for the holiday.",
      });

      return;
    }

    if (!date) {
      toast.error("Holiday date is required", {
        description: "Please select a date for the holiday.",
      });

      return;
    }

    setIsUpdating(true);

    try {
      const result = await updateOrganizationHoliday(holiday.id, {
        name: name.trim(),
        date,
        description: description.trim() || undefined,
      });

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
                "Only organization owners and admins can edit holidays.",
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

          case "CONFLICT":
            toast.error("Holiday already exists", {
              description:
                result.error || "A holiday already exists for this date.",
            });
            return;

          case "VALIDATION_ERROR":
            toast.error("Invalid holiday details", {
              description:
                result.error ||
                "Please check the holiday details and try again.",
            });
            return;

          default:
            toast.error("Unable to update holiday", {
              description:
                result.error || "Something went wrong. Please try again.",
            });
            return;
        }
      }

      /*
       * Update the calendar/list immediately after successful update.
       */
      onHolidayUpdated({
        id: result.data.holidayId,
        organizationId: result.data.organizationId,
        name: result.data.name,
        date: result.data.date,
        description: result.data.description,
      });

      toast.success("Holiday updated", {
        description: result.message || "The holiday was updated successfully.",
      });

      /*
       * Close the dialog.
       */
      onOpenChange(false);
    } catch (error) {
      console.error("[EditHolidayDialog] update holiday error:", error);

      toast.error("Something went wrong", {
        description: "Unable to update the holiday. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /*
   * Handle dialog open/close.
   */
  const handleOpenChange = (value: boolean) => {
    if (isUpdating) {
      return;
    }

    onOpenChange(value);

    if (!value) {
      setName("");
      setDate("");
      setDescription("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit holiday</AlertDialogTitle>

          <AlertDialogDescription>
            Update the holiday details for your organization calendar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5">
          {/* Holiday name */}
          <div className="space-y-2">
            <Label htmlFor="edit-holiday-name">Holiday name</Label>

            <Input
              id="edit-holiday-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Independence Day"
              disabled={isUpdating}
              autoFocus
            />
          </div>

          {/* Holiday date */}
          <div className="space-y-2">
            <Label htmlFor="edit-holiday-date">Date</Label>

            <Input
              id="edit-holiday-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isUpdating}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-holiday-description">
              Description
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </Label>

            <Textarea
              id="edit-holiday-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add any additional information about this holiday..."
              disabled={isUpdating}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="size-4 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium">Organization holiday</p>

              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                This holiday is visible to all employees in the organization
                calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel
            type="button"
            className="mt-0 flex-1"
            disabled={isUpdating}
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            className="flex-1"
            disabled={isUpdating || !name.trim() || !date}
            onClick={() => {
              void handleUpdateHoliday();
            }}
          >
            {isUpdating ? (
              <>
                <Spinner className="size-4" />
                Updating...
              </>
            ) : (
              <>
                <CalendarDays className="size-4" />
                Update holiday
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditHolidayDialog;
