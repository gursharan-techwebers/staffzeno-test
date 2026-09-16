"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { ACTIVE_LEAVE_TYPES, type LeaveTypeId } from "@/constants/leave";

import type {
  HalfDayPeriod,
  Leave,
  LeaveDuration,
} from "@/types/organization/leave";

import {
  leaveSchema,
  type LeaveInput,
} from "@/validators/organization/leave/leave";

import { createLeaveRequest } from "@/server/leave/createLeaveRequest";

type LeaveRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeaveCreated: (leave: Leave) => void;
};

const defaultValues: LeaveInput = {
  leaveType: ACTIVE_LEAVE_TYPES[0]?.id,
  startDate: "",
  endDate: undefined,
  duration: "FULL_DAY",
  halfDayPeriod: undefined,
  startTime: undefined,
  endTime: undefined,
  reason: "",
};

const LeaveRequestDialog = ({
  open,
  onOpenChange,
  onLeaveCreated,
}: LeaveRequestDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveInput>({
    resolver: zodResolver(leaveSchema),
    mode: "onSubmit",
    defaultValues,
  });

  const duration = watch("duration");
  const leaveType = watch("leaveType");
  const halfDayPeriod = watch("halfDayPeriod");

  /**
   * Keep duration-specific fields clean.
   *
   * Only MULTIPLE_DAYS uses endDate.
   * Only HALF_DAY uses halfDayPeriod.
   * Only SHORT_LEAVE uses startTime/endTime.
   */
  useEffect(() => {
    if (duration !== "MULTIPLE_DAYS") {
      setValue("endDate", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }

    if (duration !== "HALF_DAY") {
      setValue("halfDayPeriod", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }

    if (duration !== "SHORT_LEAVE") {
      setValue("startTime", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });

      setValue("endTime", undefined, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [duration, setValue]);

  const onSubmit = async (values: LeaveInput) => {
    try {
      const result = await createLeaveRequest(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof LeaveInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Leave request failed", {
          description:
            result.error || result.message || "Unable to submit leave request.",
        });

        return;
      }

      toast.success("Leave request submitted", {
        description:
          result.message ||
          "Your leave request has been submitted successfully.",
      });

      onLeaveCreated(result.data);

      reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("[LeaveRequestDialog] unexpected error:", error);

      toast.error("Leave request failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Request leave</AlertDialogTitle>

          <AlertDialogDescription>
            Submit a leave request for approval.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="-space-y-3">
            {/* Leave Type */}

            <Field>
              <FieldLabel htmlFor="leaveType">Leave Type</FieldLabel>

              <Select
                value={leaveType ?? ""}
                onValueChange={(value) => {
                  setValue("leaveType", value as LeaveTypeId, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>

                <SelectContent>
                  {ACTIVE_LEAVE_TYPES.map((leaveType) => (
                    <SelectItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.leaveType ? (
                <FieldError>{errors.leaveType.message}</FieldError>
              ) : (
                <FieldDescription>
                  Select the type of leave you want to request.
                </FieldDescription>
              )}
            </Field>

            {/* Duration */}

            <Field>
              <FieldLabel htmlFor="duration">Duration</FieldLabel>

              <Select
                value={duration}
                onValueChange={(value) => {
                  setValue("duration", value as LeaveDuration, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="FULL_DAY">Full Day</SelectItem>

                  <SelectItem value="MULTIPLE_DAYS">Multiple Days</SelectItem>

                  <SelectItem value="HALF_DAY">Half Day</SelectItem>

                  <SelectItem value="SHORT_LEAVE">Short Leave</SelectItem>
                </SelectContent>
              </Select>

              {errors.duration && (
                <FieldError>{errors.duration.message}</FieldError>
              )}
            </Field>

            {/* Start Date */}

            <Field>
              <FieldLabel htmlFor="startDate">
                {duration === "MULTIPLE_DAYS" ? "Start Date" : "Date"}
              </FieldLabel>

              <Input
                id="startDate"
                type="date"
                className="bg-background"
                disabled={isSubmitting}
                {...register("startDate")}
              />

              {errors.startDate && (
                <FieldError>{errors.startDate.message}</FieldError>
              )}
            </Field>

            {/* End Date - Multiple Days Only */}

            {duration === "MULTIPLE_DAYS" && (
              <Field>
                <FieldLabel htmlFor="endDate">End Date</FieldLabel>

                <Input
                  id="endDate"
                  type="date"
                  className="bg-background"
                  disabled={isSubmitting}
                  {...register("endDate")}
                />

                {errors.endDate ? (
                  <FieldError>{errors.endDate.message}</FieldError>
                ) : (
                  <FieldDescription>
                    Select the last day of your leave.
                  </FieldDescription>
                )}
              </Field>
            )}

            {/* Half Day */}

            {duration === "HALF_DAY" && (
              <Field>
                <FieldLabel htmlFor="halfDayPeriod">Half Day</FieldLabel>

                <Select
                  value={halfDayPeriod ?? ""}
                  onValueChange={(value) => {
                    setValue("halfDayPeriod", value as HalfDayPeriod, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="halfDayPeriod">
                    <SelectValue placeholder="Select half" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="FIRST_HALF">First Half</SelectItem>

                    <SelectItem value="SECOND_HALF">Second Half</SelectItem>
                  </SelectContent>
                </Select>

                {errors.halfDayPeriod ? (
                  <FieldError>{errors.halfDayPeriod.message}</FieldError>
                ) : (
                  <FieldDescription>
                    Select which half of the working day you will be away.
                  </FieldDescription>
                )}
              </Field>
            )}

            {/* Short Leave */}

            {duration === "SHORT_LEAVE" && (
              <>
                <Field>
                  <FieldLabel htmlFor="startTime">Start Time</FieldLabel>

                  <Input
                    id="startTime"
                    type="time"
                    className="bg-background"
                    disabled={isSubmitting}
                    {...register("startTime")}
                  />

                  {errors.startTime && (
                    <FieldError>{errors.startTime.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="endTime">End Time</FieldLabel>

                  <Input
                    id="endTime"
                    type="time"
                    className="bg-background"
                    disabled={isSubmitting}
                    {...register("endTime")}
                  />

                  {errors.endTime ? (
                    <FieldError>{errors.endTime.message}</FieldError>
                  ) : (
                    <FieldDescription>
                      Short leave duration is subject to your organization's
                      leave policy.
                    </FieldDescription>
                  )}
                </Field>
              </>
            )}

            {/* Reason */}

            <Field>
              <FieldLabel htmlFor="reason">Reason</FieldLabel>

              <Textarea
                id="reason"
                placeholder="Enter the reason for your leave..."
                className="resize-none border border-border bg-background"
                rows={4}
                disabled={isSubmitting}
                {...register("reason")}
              />

              {errors.reason ? (
                <FieldError>{errors.reason.message}</FieldError>
              ) : (
                <FieldDescription>
                  Please provide a reason for your leave. Maximum 1000
                  characters.
                </FieldDescription>
              )}
            </Field>

            {/* Root Error */}

            {errors.root?.message && (
              <FieldError>{errors.root.message}</FieldError>
            )}

            {/* Actions */}

            <AlertDialogFooter className="mt-2 flex-row gap-2">
              <AlertDialogCancel
                type="button"
                className="mt-0 flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </AlertDialogCancel>

              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="size-5" />
                    Submitting...
                  </>
                ) : (
                  "Submit request"
                )}
              </Button>
            </AlertDialogFooter>
          </FieldGroup>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveRequestDialog;
