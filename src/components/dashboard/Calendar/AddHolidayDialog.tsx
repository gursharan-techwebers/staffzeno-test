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

import { createOrganizationHoliday } from "@/server/organization/createOrganizationHoliday";

type OrganizationHoliday = {
  id: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};

type AddHolidayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onHolidayAdded: (holiday: OrganizationHoliday) => void;
};

const formatDateForInput = (date?: Date) => {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const AddHolidayDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onHolidayAdded,
}: AddHolidayDialogProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  /*
   * Set the selected calendar date when the dialog opens.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setDate(formatDateForInput(selectedDate));
  }, [open, selectedDate]);

  /*
   * Add holiday.
   */
  const handleAddHoliday = async () => {
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

    setIsAdding(true);

    try {
      const result = await createOrganizationHoliday({
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
                "Only organization owners and admins can add holidays.",
            });
            return;

          case "ORGANIZATION_NOT_FOUND":
            toast.error("Organization not found", {
              description:
                result.error || "The active organization could not be found.",
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
            toast.error("Unable to add holiday", {
              description:
                result.error || "Something went wrong. Please try again.",
            });
            return;
        }
      }

      /*
       * Update the calendar immediately after successful creation.
       */
      onHolidayAdded({
        id: result.data.holidayId,
        organizationId: result.data.organizationId,
        name: result.data.name,
        date: result.data.date,
        description: result.data.description,
      });

      toast.success("Holiday added", {
        description: result.message || "The holiday was added successfully.",
      });

      /*
       * Reset dialog state.
       */
      setName("");
      setDate("");
      setDescription("");

      onOpenChange(false);
    } catch (error) {
      console.error("[AddHolidayDialog] add holiday error:", error);

      toast.error("Something went wrong", {
        description: "Unable to add the holiday. Please try again.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  /*
   * Reset state when dialog closes.
   */
  const handleOpenChange = (value: boolean) => {
    if (isAdding) {
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
          <AlertDialogTitle>Add holiday</AlertDialogTitle>

          <AlertDialogDescription>
            Add a holiday to your organization calendar. Employees will be able
            to see it on the calendar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5">
          {/* Holiday name */}
          <div className="space-y-2">
            <Label htmlFor="holiday-name">Holiday name</Label>

            <Input
              id="holiday-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Independence Day"
              disabled={isAdding}
              autoFocus
            />
          </div>

          {/* Holiday date */}
          <div className="space-y-2">
            <Label htmlFor="holiday-date">Date</Label>

            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isAdding}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="holiday-description">
              Description
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </Label>

            <Textarea
              id="holiday-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add any additional information about this holiday..."
              disabled={isAdding}
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
                This holiday will be visible to all employees in the
                organization calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel
            type="button"
            className="mt-0 flex-1"
            disabled={isAdding}
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            className="flex-1"
            disabled={isAdding || !name.trim() || !date}
            onClick={() => {
              void handleAddHoliday();
            }}
          >
            {isAdding ? (
              <>
                <Spinner className="size-4" />
                Adding...
              </>
            ) : (
              <>
                <CalendarDays className="size-4" />
                Add holiday
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddHolidayDialog;
