"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock3Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  updateAttendanceSettingsSchema,
  WorkingDay,
  WorkingSaturday,
  type UpdateAttendanceSettingsInput,
} from "@/validators/organization/settings/attendance";

import { updateOrganizationAttendanceSettings } from "@/server/organization/updateOrganizationAttendanceSettings";

import {
  ORGANIZATION_DEFAULT_SETTINGS,
  ORGANIZATION_GRACE_PERIODS,
  ORGANIZATION_WORKING_DAYS,
  ORGANIZATION_WORKING_SATURDAYS,
} from "@/constants/organizationDefaultSettings";

type AttendanceSettingsProps = {
  settings: {
    officeStartTime: string;
    officeEndTime: string;
    gracePeriod: number;
    workingDays: WorkingDay[];
    workingSaturdays: WorkingSaturday[];
  } | null;
};

const AttendanceSettings = ({
  settings,
}: AttendanceSettingsProps) => {
  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
      isDirty,
    },
  } = useForm<UpdateAttendanceSettingsInput>({
    resolver: zodResolver(
      updateAttendanceSettingsSchema,
    ),
    mode: "onSubmit",
    defaultValues:
      settings ??
      ORGANIZATION_DEFAULT_SETTINGS.attendance,
  });

  const workingDays = watch("workingDays");
  const workingSaturdays = watch(
    "workingSaturdays",
  );

  const isSaturdayWorking =
    workingDays.includes("saturday");

  // --------------------------------------------------
  // Initialize form when settings change
  // --------------------------------------------------

  useEffect(() => {
    if (!settings) {
      return;
    }

    reset({
      officeStartTime:
        settings.officeStartTime,

      officeEndTime:
        settings.officeEndTime,

      gracePeriod:
        settings.gracePeriod,

      workingDays:
        settings.workingDays,

      workingSaturdays:
        settings.workingSaturdays,
    });
  }, [settings, reset]);

  // --------------------------------------------------
  // Working days
  // --------------------------------------------------

  const handleWorkingDayChange = (
    day: WorkingDay,
    checked: boolean,
  ) => {
    const currentDays =
      workingDays ?? [];

    if (checked) {
      if (currentDays.includes(day)) {
        return;
      }

      setValue(
        "workingDays",
        [...currentDays, day],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      return;
    }

    setValue(
      "workingDays",
      currentDays.filter(
        (item) => item !== day,
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  // --------------------------------------------------
  // Working Saturdays
  // --------------------------------------------------

  const handleWorkingSaturdayChange = (
    saturday: WorkingSaturday,
    checked: boolean,
  ) => {
    const currentSaturdays =
      workingSaturdays ?? [];

    if (checked) {
      if (
        currentSaturdays.includes(saturday)
      ) {
        return;
      }

      setValue(
        "workingSaturdays",
        [...currentSaturdays, saturday].sort(
          (a, b) => a - b,
        ),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      return;
    }

    setValue(
      "workingSaturdays",
      currentSaturdays.filter(
        (item) => item !== saturday,
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const onSubmit = async (
    values: UpdateAttendanceSettingsInput,
  ) => {
    if (!isDirty || isSubmitting) {
      return;
    }

    try {
      const result =
        await updateOrganizationAttendanceSettings(
          values,
        );

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [
            field,
            messages,
          ] of Object.entries(
            result.fieldErrors,
          )) {
            const message =
              messages?.[0];

            if (message) {
              setError(
                field as keyof UpdateAttendanceSettingsInput,
                {
                  type: "server",
                  message,
                },
              );
            }
          }
        }

        toast.error(
          "Attendance Settings Update Failed",
          {
            description:
              result.error,
          },
        );

        return;
      }

      toast.success(
        "Attendance Settings Updated",
        {
          description:
            result.message ||
            "Your attendance and working hour settings have been updated.",
        },
      );

      reset(values);
    } catch (error) {
      console.error(
        "[AttendanceSettings] update error:",
        error,
      );

      toast.error(
        "Attendance Settings Update Failed",
        {
          description:
            "Something went wrong. Please try again.",
        },
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      {/* Header */}

      <div>
        <h3 className="text-base font-semibold">
          Attendance & Working Hours
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure your organization's working
          hours and attendance rules.
        </p>
      </div>

      <Separator />

      {/* Office Hours */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">
            Office hours
          </h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Set the standard start and end time
            for your organization.
          </p>
        </div>

        <FieldGroup className="grid grid-cols-2 gap-4">
          {/* Start time */}

          <Field>
            <FieldLabel htmlFor="office-start-time">
              Office start time
            </FieldLabel>

            <div className="relative">
              <Clock3Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="office-start-time"
                type="time"
                disabled={isSubmitting}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 pl-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={watch(
                  "officeStartTime",
                )}
                onChange={(event) =>
                  setValue(
                    "officeStartTime",
                    event.target.value,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
              />
            </div>

            {errors.officeStartTime && (
              <FieldError>
                {
                  errors.officeStartTime
                    .message
                }
              </FieldError>
            )}
          </Field>

          {/* End time */}

          <Field>
            <FieldLabel htmlFor="office-end-time">
              Office end time
            </FieldLabel>

            <div className="relative">
              <Clock3Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="office-end-time"
                type="time"
                disabled={isSubmitting}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 pl-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={watch(
                  "officeEndTime",
                )}
                onChange={(event) =>
                  setValue(
                    "officeEndTime",
                    event.target.value,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
              />
            </div>

            {errors.officeEndTime && (
              <FieldError>
                {
                  errors.officeEndTime
                    .message
                }
              </FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Grace Period */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">
            Attendance grace period
          </h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Allow employees to arrive after the
            office start time without being marked
            late.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="grace-period">
            Grace period
          </FieldLabel>

          <Select
            value={String(
              watch("gracePeriod"),
            )}
            onValueChange={(value) =>
              setValue(
                "gracePeriod",
                Number(value),
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              )
            }
            disabled={isSubmitting}
          >
            <SelectTrigger
              id="grace-period"
              className="w-full"
            >
              <SelectValue placeholder="Select grace period" />
            </SelectTrigger>

            <SelectContent>
              {ORGANIZATION_GRACE_PERIODS.map(
                (period) => (
                  <SelectItem
                    key={period.value}
                    value={period.value}
                  >
                    {period.label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {errors.gracePeriod && (
            <FieldError>
              {
                errors.gracePeriod.message
              }
            </FieldError>
          )}
        </Field>
      </section>

      {/* Working Days */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">
            Working days
          </h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the days employees are expected
            to work.
          </p>
        </div>

        <div className="rounded-lg border">
          <div className="divide-y">
            {ORGANIZATION_WORKING_DAYS.map(
              (day) => {
                const checked =
                  workingDays.includes(
                    day.value,
                  );

                return (
                  <label
                    key={day.value}
                    htmlFor={`working-day-${day.value}`}
                    className="flex cursor-pointer items-center gap-3 p-4"
                  >
                    <Checkbox
                      id={`working-day-${day.value}`}
                      checked={checked}
                      disabled={isSubmitting}
                      onCheckedChange={(
                        value,
                      ) =>
                        handleWorkingDayChange(
                          day.value,
                          value === true,
                        )
                      }
                    />

                    <span className="text-sm font-medium">
                      {day.label}
                    </span>
                  </label>
                );
              },
            )}
          </div>
        </div>

        {errors.workingDays && (
          <FieldError>
            {errors.workingDays.message}
          </FieldError>
        )}
      </section>

      {/* Working Saturdays */}

      {isSaturdayWorking && (
        <section className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">
              Working Saturdays
            </h4>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the Saturdays employees are
              expected to work.
            </p>
          </div>

          <div className="rounded-lg border">
            <div className="divide-y">
              {ORGANIZATION_WORKING_SATURDAYS.map(
                (saturday) => {
                  const checked =
                    workingSaturdays.includes(
                      saturday.value,
                    );

                  return (
                    <label
                      key={saturday.value}
                      htmlFor={`working-saturday-${saturday.value}`}
                      className="flex cursor-pointer items-center gap-3 p-4"
                    >
                      <Checkbox
                        id={`working-saturday-${saturday.value}`}
                        checked={checked}
                        disabled={isSubmitting}
                        onCheckedChange={(
                          value,
                        ) =>
                          handleWorkingSaturdayChange(
                            saturday.value,
                            value === true,
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        {saturday.label}
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </div>

          {errors.workingSaturdays && (
            <FieldError>
              {
                errors.workingSaturdays
                  .message
              }
            </FieldError>
          )}
        </section>
      )}

      {/* Actions */}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            !isDirty || isSubmitting
          }
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
      </div>
    </form>
  );
};

export default AttendanceSettings;