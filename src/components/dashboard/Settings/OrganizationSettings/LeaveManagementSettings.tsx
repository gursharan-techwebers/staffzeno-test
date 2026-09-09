"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock3Icon, CoinsIcon, Repeat2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  updateLeaveManagementSchema,
  type UpdateLeaveManagementInput,
} from "@/validators/organization/settings/leave";
import { updateLeaveManagement } from "@/server/organization/updateLeaveManagement";
import {
  ORGANIZATION_DEFAULT_SETTINGS,
  ORGANIZATION_SHORT_LEAVE_DURATIONS,
} from "@/constants/organizationDefaultSettings";

type LeaveManagementSettingsProps = {
  settings: {
    monthlyPaidLeaves: number;
    monthlyPaidHalfDayLeaves: number;
    monthlyPaidShortLeaves: number;
    shortLeaveDuration: number;
    carryForwardEnabled: boolean;
    leaveEncashmentEnabled: boolean;
  } | null;
};

const LeaveManagementSettings = ({
  settings,
}: LeaveManagementSettingsProps) => {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateLeaveManagementInput>({
    resolver: zodResolver(updateLeaveManagementSchema),
    mode: "onSubmit",
    defaultValues: settings ?? ORGANIZATION_DEFAULT_SETTINGS.leave,
  });

  const carryForwardEnabled = watch("carryForwardEnabled");
  const leaveEncashmentEnabled = watch("leaveEncashmentEnabled");

  // --------------------------------------------------
  // Initialize form when settings change
  // --------------------------------------------------

  useEffect(() => {
    if (!settings) {
      return;
    }

    reset({
      monthlyPaidLeaves: settings.monthlyPaidLeaves,
      monthlyPaidHalfDayLeaves: settings.monthlyPaidHalfDayLeaves,
      monthlyPaidShortLeaves: settings.monthlyPaidShortLeaves,
      shortLeaveDuration: settings.shortLeaveDuration,
      carryForwardEnabled: settings.carryForwardEnabled,
      leaveEncashmentEnabled: settings.leaveEncashmentEnabled,
    });
  }, [settings, reset]);

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const onSubmit = async (values: UpdateLeaveManagementInput) => {
    if (!isDirty || isSubmitting) {
      return;
    }

    try {
      const result = await updateLeaveManagement(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof UpdateLeaveManagementInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Leave Settings Update Failed", {
          description: result.error,
        });

        return;
      }

      toast.success("Leave Settings Updated", {
        description:
          result.message || "Your leave management settings have been updated.",
      });

      // Mark saved values as the new clean form state.
      reset(values);
    } catch (error) {
      console.error("[LeaveManagementSettings] update error:", error);

      toast.error("Leave Settings Update Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}

      <div>
        <h3 className="text-base font-semibold">Leave Management</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure monthly leave allowances and leave policies for your
          organization.
        </p>
      </div>

      <Separator />

      {/* Monthly Leave Allowances */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Monthly leave allowance</h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Set the number of paid leaves employees receive each month.
          </p>
        </div>

        <FieldGroup className="-space-y-3">
          {/* Paid leaves */}

          <Field>
            <FieldLabel htmlFor="monthly-paid-leaves">
              Monthly paid leaves
            </FieldLabel>

            <Input
              id="monthly-paid-leaves"
              type="number"
              min={0}
              max={31}
              step={1}
              disabled={isSubmitting}
              {...register("monthlyPaidLeaves", {
                valueAsNumber: true,
              })}
            />

            <FieldDescription>
              Number of full paid leaves allocated each month.
            </FieldDescription>

            {errors.monthlyPaidLeaves && (
              <FieldError>{errors.monthlyPaidLeaves.message}</FieldError>
            )}
          </Field>

          {/* Half-day leaves */}

          <Field>
            <FieldLabel htmlFor="monthly-paid-half-day-leaves">
              Monthly paid half-day leaves
            </FieldLabel>

            <Input
              id="monthly-paid-half-day-leaves"
              type="number"
              min={0}
              max={31}
              step={1}
              disabled={isSubmitting}
              {...register("monthlyPaidHalfDayLeaves", {
                valueAsNumber: true,
              })}
            />

            <FieldDescription>
              Number of paid half-day leaves allocated each month.
            </FieldDescription>

            {errors.monthlyPaidHalfDayLeaves && (
              <FieldError>{errors.monthlyPaidHalfDayLeaves.message}</FieldError>
            )}
          </Field>

          {/* Short leaves */}

          <Field>
            <FieldLabel htmlFor="monthly-paid-short-leaves">
              Monthly paid short leaves
            </FieldLabel>

            <Input
              id="monthly-paid-short-leaves"
              type="number"
              min={0}
              max={31}
              step={1}
              disabled={isSubmitting}
              {...register("monthlyPaidShortLeaves", {
                valueAsNumber: true,
              })}
            />

            <FieldDescription>
              Number of paid short leaves employees can use each month.
            </FieldDescription>

            {errors.monthlyPaidShortLeaves && (
              <FieldError>{errors.monthlyPaidShortLeaves.message}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Short Leave Duration */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Short leave</h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Define the maximum duration allowed for a single short leave.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="short-leave-duration">
            Short leave duration
          </FieldLabel>

          <div className="relative">
            <Clock3Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Select
              value={String(watch("shortLeaveDuration"))}
              onValueChange={(value) =>
                setValue("shortLeaveDuration", Number(value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="short-leave-duration" className="w-full pl-9">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>

              <SelectContent>
                {ORGANIZATION_SHORT_LEAVE_DURATIONS.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errors.shortLeaveDuration && (
            <FieldError>{errors.shortLeaveDuration.message}</FieldError>
          )}
        </Field>
      </section>

      {/* Leave Policies */}

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Leave policies</h4>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure how unused and eligible leaves are handled.
          </p>
        </div>

        <div className="rounded-lg border">
          {/* Carry Forward */}

          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Repeat2Icon className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">Carry forward leaves</p>

                <p className="text-sm text-muted-foreground">
                  Allow unused leaves to carry forward to the next month.
                </p>
              </div>
            </div>

            <Switch
              checked={carryForwardEnabled}
              disabled={isSubmitting}
              onCheckedChange={(checked) =>
                setValue("carryForwardEnabled", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>

          <Separator />

          {/* Leave Encashment */}

          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <CoinsIcon className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">Leave encashment</p>

                <p className="text-sm text-muted-foreground">
                  Allow eligible unused leaves to be converted into payment.
                </p>
              </div>
            </div>

            <Switch
              checked={leaveEncashmentEnabled}
              disabled={isSubmitting}
              onCheckedChange={(checked) =>
                setValue("leaveEncashmentEnabled", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>
      </section>

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

export default LeaveManagementSettings;
