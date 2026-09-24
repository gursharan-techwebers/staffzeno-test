"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock3Icon, InfoIcon } from "lucide-react";
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
  ORGANIZATION_WORKING_HOUR_OPTIONS,
  ORGANIZATION_WORKING_SATURDAYS,
} from "@/constants/organizationDefaultSettings";
import { Badge } from "@/components/ui/badge";

type AttendanceSettingsProps = {
  settings: {
    timezone: string;
    minimumWorkingMinutes: number;
    gracePeriod: number;
    finalizationWindowMinutes: number;
    workingDays: WorkingDay[];
    workingSaturdays: WorkingSaturday[];
  } | null;
};

/**
 * Common IANA timezones.
 *
 * The stored value is always the IANA timezone identifier.
 */
const ORGANIZATION_TIMEZONES = [
  {
    value: "Asia/Kolkata",
    label: "India Standard Time (Asia/Kolkata)",
  },
  {
    value: "America/New_York",
    label: "Eastern Time (America/New_York)",
  },
  {
    value: "America/Chicago",
    label: "Central Time (America/Chicago)",
  },
  {
    value: "America/Denver",
    label: "Mountain Time (America/Denver)",
  },
  {
    value: "America/Los_Angeles",
    label: "Pacific Time (America/Los_Angeles)",
  },
  {
    value: "Europe/London",
    label: "United Kingdom Time (Europe/London)",
  },
  {
    value: "Europe/Paris",
    label: "Central European Time (Europe/Paris)",
  },
  {
    value: "Asia/Dubai",
    label: "Gulf Standard Time (Asia/Dubai)",
  },
  {
    value: "Asia/Singapore",
    label: "Singapore Time (Asia/Singapore)",
  },
  {
    value: "Asia/Tokyo",
    label: "Japan Standard Time (Asia/Tokyo)",
  },
  {
    value: "Australia/Sydney",
    label: "Australian Eastern Time (Australia/Sydney)",
  },
] as const;

const AttendanceSettings = ({ settings }: AttendanceSettingsProps) => {
  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateAttendanceSettingsInput>({
    resolver: zodResolver(updateAttendanceSettingsSchema),
    mode: "onSubmit",
    defaultValues: settings ?? ORGANIZATION_DEFAULT_SETTINGS.attendance,
  });

  const timezone = watch("timezone");

  const minimumWorkingMinutes = watch("minimumWorkingMinutes");

  const workingDays = watch("workingDays");

  const workingSaturdays = watch("workingSaturdays");

  const gracePeriod = watch("gracePeriod");

  const isSaturdayWorking = workingDays.includes("saturday");

  // --------------------------------------------------
  // Initialize form when settings change
  // --------------------------------------------------

  useEffect(() => {
    if (!settings) {
      return;
    }

    reset({
      timezone: settings.timezone,

      minimumWorkingMinutes: settings.minimumWorkingMinutes,

      gracePeriod: settings.gracePeriod,

      finalizationWindowMinutes: settings.finalizationWindowMinutes,

      workingDays: settings.workingDays,

      workingSaturdays: settings.workingSaturdays,
    });
  }, [settings, reset]);

  // --------------------------------------------------
  // Working days
  // --------------------------------------------------

  const handleWorkingDayChange = (day: WorkingDay, checked: boolean) => {
    const currentDays = workingDays ?? [];

    if (checked) {
      if (currentDays.includes(day)) {
        return;
      }

      setValue("workingDays", [...currentDays, day], {
        shouldDirty: true,
        shouldValidate: true,
      });

      return;
    }

    setValue(
      "workingDays",
      currentDays.filter((item) => item !== day),
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
    const currentSaturdays = workingSaturdays ?? [];

    if (checked) {
      if (currentSaturdays.includes(saturday)) {
        return;
      }

      setValue(
        "workingSaturdays",
        [...currentSaturdays, saturday].sort((a, b) => a - b),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );

      return;
    }

    setValue(
      "workingSaturdays",
      currentSaturdays.filter((item) => item !== saturday),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const onSubmit = async (values: UpdateAttendanceSettingsInput) => {
    if (!isDirty || isSubmitting) {
      return;
    }

    try {
      const result = await updateOrganizationAttendanceSettings(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof UpdateAttendanceSettingsInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Attendance Settings Update Failed", {
          description: result.error,
        });

        return;
      }

      toast.success("Attendance Settings Updated", {
        description:
          result.message ||
          "Your attendance and working hour settings have been updated.",
      });

      reset(values);
    } catch (error) {
      console.error("[AttendanceSettings] update error:", error);

      toast.error("Attendance Settings Update Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}

      <div>
        <h3 className="text-base font-semibold">Attendance & Working Hours</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure your organization's working hours and attendance rules.
        </p>
      </div>

      <Separator />

      {/* Attendance Timezone */}

      <section className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <InfoIcon className="size-4 text-amber-600 dark:text-amber-400" />
            </div>

            <div>
              <h4 className="text-sm font-semibold">Attendance timezone</h4>

              <p className="mt-1 text-sm text-muted-foreground">
                This timezone is used to determine attendance dates, working
                days, holidays, punch times, and attendance calculations. Make
                sure it matches your organization's local timezone.
              </p>
            </div>
          </div>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="attendance-timezone">
              Organization timezone
            </FieldLabel>

            <Select
              value={timezone}
              onValueChange={(value) =>
                setValue("timezone", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="attendance-timezone" className="w-full">
                <div className="flex items-center gap-2">
                  <Clock3Icon className="size-4 text-muted-foreground" />

                  <SelectValue placeholder="Select organization timezone" />
                </div>
              </SelectTrigger>

              <SelectContent>
                {ORGANIZATION_TIMEZONES.map((timezoneOption) => (
                  <SelectItem
                    key={timezoneOption.value}
                    value={timezoneOption.value}
                  >
                    {timezoneOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.timezone && (
              <FieldError>{errors.timezone.message}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Minimum Working Hours */}

      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Minimum working hours</h4>
            <Badge
              variant={"outline"}
              className="border border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 flex items-center justify-center gap-1.5 p-2 py-3"
            >
              <InfoIcon className="size-4 text-amber-600 dark:text-amber-400" />
              excluding break time
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Set the minimum amount of time an employee must work during a
            scheduled working day.
          </p>
        </div>

        <FieldGroup>
          <Field>
            <Select
              value={String(minimumWorkingMinutes)}
              onValueChange={(value) =>
                setValue("minimumWorkingMinutes", Number(value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="minimum-working-hours" className="w-full">
                <SelectValue placeholder="Select minimum working hours" />
              </SelectTrigger>

              <SelectContent>
                {ORGANIZATION_WORKING_HOUR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.minimumWorkingMinutes && (
              <FieldError>{errors.minimumWorkingMinutes.message}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Grace Period */}

      <section className="space-y-4">
        <Field>
          <FieldLabel htmlFor="grace-period">Grace period</FieldLabel>

          <Select
            value={String(gracePeriod)}
            onValueChange={(value) =>
              setValue("gracePeriod", Number(value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="grace-period" className="w-full">
              <SelectValue placeholder="Select grace period" />
            </SelectTrigger>

            <SelectContent>
              {ORGANIZATION_GRACE_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.gracePeriod && (
            <FieldError>{errors.gracePeriod.message}</FieldError>
          )}
        </Field>
      </section>

      {/* Working Days */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Working days</h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the days employees are expected to work.
          </p>
        </div>

        <div className="rounded-lg border">
          <div className="divide-y">
            {ORGANIZATION_WORKING_DAYS.map((day) => {
              const checked = workingDays.includes(day.value);

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
                    onCheckedChange={(value) =>
                      handleWorkingDayChange(day.value, value === true)
                    }
                  />

                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {errors.workingDays && (
          <FieldError>{errors.workingDays.message}</FieldError>
        )}
      </section>

      {/* Working Saturdays */}

      {isSaturdayWorking && (
        <section className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Working Saturdays</h4>

            <p className="mt-1 text-sm text-muted-foreground">
              Select the Saturdays employees are expected to work.
            </p>
          </div>

          <div className="rounded-lg border">
            <div className="divide-y">
              {ORGANIZATION_WORKING_SATURDAYS.map((saturday) => {
                const checked = workingSaturdays.includes(saturday.value);

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
                      onCheckedChange={(value) =>
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
              })}
            </div>
          </div>

          {errors.workingSaturdays && (
            <FieldError>{errors.workingSaturdays.message}</FieldError>
          )}
        </section>
      )}

      {/* Actions */}

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
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
