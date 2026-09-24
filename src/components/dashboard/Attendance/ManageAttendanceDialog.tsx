"use client";

import { useEffect, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { Coffee, Plus, Trash2 } from "lucide-react";

import { getAttendanceDetails } from "@/server/attendance/getAttendanceDetails";

import {
  updateAttendanceSchema,
  type UpdateAttendanceSchemaInput,
} from "@/validators/organization/attendance/attendance";

import { updateAttendance } from "@/server/attendance/updateAttendance";
import { Spinner } from "@/components/ui/spinner";
import { WorkSummaryEditor } from "./WorkSummaryEditor";

type AttendanceDetails = Awaited<ReturnType<typeof getAttendanceDetails>>;

type ManageAttendanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string | null;
  onSaved?: (attendance: AttendanceDetails) => void;
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const formatTimeInput = (value: string | Date | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDate = (value: string | Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatMinutes = (minutes: number) => {
  if (minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

// --------------------------------------------------
// Field Error
// --------------------------------------------------

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

// --------------------------------------------------
// Break Fields
// --------------------------------------------------

function BreakFields({ sessionIndex }: { sessionIndex: number }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<UpdateAttendanceSchemaInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `sessions.${sessionIndex}.breaks`,
    keyName: "fieldId",
  });

  const sessionErrors = errors.sessions?.[sessionIndex];

  const addBreak = () => {
    append({
      start: "",
      end: "",
    });
  };

  return (
    <div className="mt-5 border-t pt-4">
      {/* Break header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Coffee className="size-4 shrink-0 text-muted-foreground" />

          <span className="text-sm font-medium">Breaks</span>

          <span className="text-xs text-muted-foreground">
            ({fields.length})
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={addBreak}
        >
          <Plus className="mr-1.5 size-3.5" />
          Add break
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            No breaks recorded for this session.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, breakIndex) => {
            const breakErrors = sessionErrors?.breaks?.[breakIndex];

            return (
              <div key={field.fieldId} className="rounded-lg bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium">
                    Break {breakIndex + 1}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(breakIndex)}
                  >
                    <Trash2 className="size-3.5" />

                    <span className="sr-only">Remove break</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Break start */}
                  <Field>
                    <FieldLabel htmlFor={`break-${field.fieldId}-start`}>
                      Start
                    </FieldLabel>

                    <Input
                      id={`break-${field.fieldId}-start`}
                      type="time"
                      aria-invalid={!!breakErrors?.start}
                      {...register(
                        `sessions.${sessionIndex}.breaks.${breakIndex}.start`,
                      )}
                    />

                    <FieldErrorMessage message={breakErrors?.start?.message} />
                  </Field>

                  {/* Break end */}
                  <Field>
                    <FieldLabel htmlFor={`break-${field.fieldId}-end`}>
                      End
                    </FieldLabel>

                    <Input
                      id={`break-${field.fieldId}-end`}
                      type="time"
                      aria-invalid={!!breakErrors?.end}
                      {...register(
                        `sessions.${sessionIndex}.breaks.${breakIndex}.end`,
                      )}
                    />

                    <FieldErrorMessage message={breakErrors?.end?.message} />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Session Fields
// --------------------------------------------------

function SessionFields({
  sessionIndex,
  onRemove,
}: {
  sessionIndex: number;
  onRemove: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<UpdateAttendanceSchemaInput>();

  const sessionErrors = errors.sessions?.[sessionIndex];

  function WorkSummaryField({
    sessionIndex,
    error,
  }: {
    sessionIndex: number;
    error?: string;
  }) {
    const { watch, setValue } = useFormContext<UpdateAttendanceSchemaInput>();

    const fieldName = `sessions.${sessionIndex}.workSummary` as const;

    const value = watch(fieldName) ?? "";

    return (
      <>
        <WorkSummaryEditor
          value={value}
          onChange={(value) => {
            setValue(fieldName, value, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          placeholder="Describe what was worked on during this session..."
        />

        <FieldErrorMessage message={error} />
      </>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      {/* Session header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Session {sessionIndex + 1}</p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Employee work session
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />

          <span className="sr-only">Remove session</span>
        </Button>
      </div>

      {/* Session times */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Start */}
        <Field>
          <FieldLabel htmlFor={`session-${sessionIndex}-start`}>
            Start
          </FieldLabel>

          <Input
            id={`session-${sessionIndex}-start`}
            type="time"
            aria-invalid={!!sessionErrors?.start}
            {...register(`sessions.${sessionIndex}.start`)}
          />

          <FieldErrorMessage message={sessionErrors?.start?.message} />
        </Field>

        {/* End */}
        <Field>
          <FieldLabel htmlFor={`session-${sessionIndex}-end`}>End</FieldLabel>

          <Input
            id={`session-${sessionIndex}-end`}
            type="time"
            aria-invalid={!!sessionErrors?.end}
            {...register(`sessions.${sessionIndex}.end`)}
          />

          <FieldErrorMessage message={sessionErrors?.end?.message} />
        </Field>
      </div>

      {/* Work Summary */}
      <Field className="mt-4">
        <FieldLabel>Work summary</FieldLabel>

        <WorkSummaryField
          sessionIndex={sessionIndex}
          error={sessionErrors?.workSummary?.message}
        />
      </Field>

      {/* Breaks */}
      <BreakFields sessionIndex={sessionIndex} />
    </div>
  );
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export function ManageAttendanceDialog({
  open,
  onOpenChange,
  attendanceId,
  onSaved,
}: ManageAttendanceDialogProps) {
  const [attendance, setAttendance] = useState<AttendanceDetails | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<UpdateAttendanceSchemaInput>({
    resolver: zodResolver(updateAttendanceSchema),
    defaultValues: {
      attendanceId: "",
      reason: "",
      sessions: [],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    control,
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = methods;

  const {
    fields: sessionFields,
    append: appendSession,
    remove: removeSession,
  } = useFieldArray({
    control,
    name: "sessions",
    keyName: "fieldId",
  });

  // --------------------------------------------------
  // Load attendance
  // --------------------------------------------------

  useEffect(() => {
    if (!open || !attendanceId) {
      return;
    }

    let cancelled = false;

    const loadAttendance = async () => {
      try {
        setIsLoading(true);

        const result = await getAttendanceDetails(attendanceId);

        if (cancelled) {
          return;
        }

        setAttendance(result);

        reset({
          attendanceId: result.id,
          reason: "",
          sessions: result.sessions.map((session) => ({
            id: session.id,
            sessionNumber: session.sessionNumber,
            start: formatTimeInput(session.punchedInAt),
            end: formatTimeInput(session.punchedOutAt),

            // Existing session work summary.
            // Older/system-created sessions may legitimately have null.
            workSummary: session.workSummary ?? "",

            breaks: session.breaks.map((breakItem) => ({
              id: breakItem.id,
              start: formatTimeInput(breakItem.startedAt),
              end: formatTimeInput(breakItem.endedAt),
            })),
          })),
        });
      } catch (error) {
        console.error(
          "[ManageAttendanceDialog] Failed to load attendance:",
          error,
        );

        toast.error("Unable to load attendance", {
          description:
            "Something went wrong while loading this attendance record.",
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [attendanceId, open, reset]);

  // --------------------------------------------------
  // Reset form when dialog closes
  // --------------------------------------------------

  useEffect(() => {
    if (!open) {
      reset({
        attendanceId: "",
        reason: "",
        sessions: [],
      });

      setAttendance(null);
    }
  }, [open, reset]);

  // --------------------------------------------------
  // Add session
  // --------------------------------------------------

  const addSession = () => {
    appendSession({
      sessionNumber: sessionFields.length + 1,
      start: "",
      end: "",
      workSummary: "",
      breaks: [],
    });
  };

  // --------------------------------------------------
  // Remove session
  // --------------------------------------------------

  const handleRemoveSession = (index: number) => {
    removeSession(index);

    const sessions = methods.getValues("sessions");

    sessions.forEach((_, sessionIndex) => {
      methods.setValue(
        `sessions.${sessionIndex}.sessionNumber`,
        sessionIndex + 1,
        {
          shouldDirty: true,
          shouldValidate: false,
        },
      );
    });
  };

  // --------------------------------------------------
  // Invalid submit
  // --------------------------------------------------

  const handleInvalidSubmit = () => {
    toast.error("Please fix the highlighted fields", {
      description: "Check the session times, breaks, and reason before saving.",
    });
  };

  // --------------------------------------------------
  // Valid submit
  // --------------------------------------------------

  const handleValidSubmit = async (values: UpdateAttendanceSchemaInput) => {
    try {
      const payload: UpdateAttendanceSchemaInput = {
        ...values,

        sessions: values.sessions.map((session, index) => ({
          ...session,
          sessionNumber: index + 1,
        })),
      };

      const result = await updateAttendance(payload);

      if (!result.success) {
        // -----------------------------------------------
        // Server-side field validation errors
        // -----------------------------------------------

        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (!message) {
              continue;
            }

            setError(field as keyof UpdateAttendanceSchemaInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error("Unable to update attendance", {
          description:
            result.error || "Something went wrong while updating attendance.",
        });

        return;
      }

      // -----------------------------------------------
      // Successful update
      // -----------------------------------------------

      const updatedAttendance = result.data.attendance;

      toast.success("Attendance updated", {
        description:
          result.message || "Attendance has been updated successfully.",
      });

      // Re-fetch the complete attendance details.
      // This preserves the existing behavior that enriches
      // ADMIN-closed sessions with audit information.
      const refreshedAttendance = await getAttendanceDetails(
        updatedAttendance.id,
      );

      // Update local dialog state.
      setAttendance(refreshedAttendance);

      // Update parent/table/detail state.
      onSaved?.(refreshedAttendance);

      // Reset the form once.
      // The refreshed data includes the saved work summaries.
      reset({
        attendanceId: refreshedAttendance.id,
        reason: "",
        sessions: refreshedAttendance.sessions.map((session) => ({
          id: session.id,
          sessionNumber: session.sessionNumber,
          start: formatTimeInput(session.punchedInAt),
          end: formatTimeInput(session.punchedOutAt),
          workSummary: session.workSummary ?? "",
          breaks: session.breaks.map((breakItem) => ({
            id: breakItem.id,
            start: formatTimeInput(breakItem.startedAt),
            end: formatTimeInput(breakItem.endedAt),
          })),
        })),
      });

      // Close after successful save.
      onOpenChange(false);
    } catch (error) {
      console.error(
        "[ManageAttendanceDialog] Failed to update attendance:",
        error,
      );

      toast.error("Unable to update attendance", {
        description: "Something went wrong while saving the attendance record.",
      });
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <FormProvider {...methods}>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent
          className="
            flex
            max-h-[90vh]
            flex-col
            overflow-hidden
            p-0
            sm:max-w-2xl!
          "
        >
          {/* ------------------------------------------------ */}
          {/* Header */}
          {/* ------------------------------------------------ */}

          <AlertDialogHeader className="shrink-0 px-6 pt-6">
            <AlertDialogTitle>Manage attendance</AlertDialogTitle>

            <AlertDialogDescription>
              Update work sessions and breaks for this attendance record.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          {/* ------------------------------------------------ */}
          {/* Form */}
          {/* ------------------------------------------------ */}

          <form
            onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* ------------------------------------------------ */}
            {/* Scrollable content */}
            {/* ------------------------------------------------ */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 px-6 py-3">
                {/* Employee summary */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  {isLoading || !attendance ? (
                    <div className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />

                      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {attendance.employee.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {attendance.employee.title}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium">
                          {formatDate(attendance.date)}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Required: {formatMinutes(attendance.requiredMinutes)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attendance settings */}
                <FieldGroup className="-space-y-3">
                  <Field>
                    <FieldLabel>Attendance settings</FieldLabel>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Required time
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {isLoading || !attendance
                            ? "—"
                            : formatMinutes(attendance.requiredMinutes)}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Current worked time
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {isLoading || !attendance
                            ? "—"
                            : formatMinutes(attendance.workedMinutes)}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Overtime
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {isLoading || !attendance
                            ? "—"
                            : formatMinutes(attendance.overtimeMinutes)}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Shortfall
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {isLoading || !attendance
                            ? "—"
                            : formatMinutes(attendance.shortfallMinutes)}
                        </p>
                      </div>
                    </div>
                  </Field>
                </FieldGroup>

                {/* Work sessions */}
                <FieldGroup className="-space-y-3">
                  <Field>
                    <FieldLabel>Work sessions</FieldLabel>

                    {errors.sessions?.message && (
                      <FieldErrorMessage message={errors.sessions.message} />
                    )}

                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="space-y-4">
                          {[1, 2].map((item) => (
                            <div
                              key={item}
                              className="rounded-xl border bg-background p-4"
                            >
                              <div className="mb-4 space-y-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />

                                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                              </div>

                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="h-10 animate-pulse rounded-md bg-muted" />

                                <div className="h-10 animate-pulse rounded-md bg-muted" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {sessionFields.map((sessionField, sessionIndex) => (
                            <SessionFields
                              key={sessionField.fieldId}
                              sessionIndex={sessionIndex}
                              onRemove={() => handleRemoveSession(sessionIndex)}
                            />
                          ))}

                          {/* Add session */}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={addSession}
                          >
                            <Plus className="mr-2 size-4" />
                            Add session
                          </Button>
                        </>
                      )}
                    </div>
                  </Field>
                </FieldGroup>

                {/* Change reason */}
                <FieldGroup className="-space-y-3">
                  <Field>
                    <FieldLabel htmlFor="attendance-change-reason">
                      Reason for change
                    </FieldLabel>

                    <Input
                      id="attendance-change-reason"
                      placeholder="e.g. Corrected missed punch-out"
                      aria-invalid={!!errors.reason}
                      {...register("reason")}
                    />

                    <FieldErrorMessage message={errors.reason?.message} />
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* ------------------------------------------------ */}
            {/* Fixed footer */}
            {/* ------------------------------------------------ */}

            <Separator className="mb-2" />

            <AlertDialogFooter className="shrink-0 flex-row gap-2 px-6 py-4">
              <AlertDialogCancel type="button" className="mt-0 flex-1">
                Cancel
              </AlertDialogCancel>

              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !attendance || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-5" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}
