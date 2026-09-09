"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
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

import {
  updateOrganizationGeneralSchema,
  type UpdateOrganizationGeneralInput,
} from "@/validators/organization/settings/general";
import { updateOrganizationGeneral } from "@/server/organization/updateOrganizationGeneral";

type GeneralSettingsProps = {
  organization: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
};

const GeneralSettings = ({ organization }: GeneralSettingsProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateOrganizationGeneralInput>({
    resolver: zodResolver(updateOrganizationGeneralSchema),
    mode: "onSubmit",
    defaultValues: {
      name: organization.name,
      email: organization.email ?? "",
      phone: organization.phone ?? "",
      address: organization.address ?? "",
    },
  });

  // --------------------------------------------------
  // Initialize form when organization changes
  // --------------------------------------------------

  useEffect(() => {
    reset({
      name: organization.name,
      email: organization.email ?? "",
      phone: organization.phone ?? "",
      address: organization.address ?? "",
    });
  }, [organization, reset]);

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const onSubmit = async (values: UpdateOrganizationGeneralInput) => {
    if (!isDirty || isSubmitting) {
      return;
    }

    try {
      const result = await updateOrganizationGeneral(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof UpdateOrganizationGeneralInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Organization Update Failed", {
          description: result.error,
        });

        return;
      }

      toast.success("Organization Updated", {
        description:
          result.message || "Your organization information has been updated.",
      });

      // Mark saved values as the new clean form state.
      reset(values);
    } catch (error) {
      console.error("[GeneralSettings] organization update error:", error);

      toast.error("Organization Update Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}

      <div>
        <h3 className="text-base font-semibold">General</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization information.
        </p>
      </div>

      <Separator />

      {/* Organization information */}

      <FieldGroup className="-space-y-3">
        {/* Name */}

        <Field>
          <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>

          <Input
            id="organization-name"
            type="text"
            placeholder="Enter organization name"
            disabled={isSubmitting}
            {...register("name")}
          />

          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        {/* Email */}

        <Field>
          <FieldLabel htmlFor="organization-email">Email</FieldLabel>

          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="organization-email"
              type="text"
              placeholder="Enter organization email"
              disabled={isSubmitting}
              className="pl-9"
              {...register("email")}
            />
          </div>

          {errors.email ? (
            <FieldError className="max-w-md">{errors.email.message}</FieldError>
          ) : (
            <FieldDescription>
              This email address is used for official organization
              communication.
            </FieldDescription>
          )}
        </Field>

        {/* Phone */}

        <Field>
          <FieldLabel htmlFor="organization-phone">Phone</FieldLabel>

          <div className="relative">
            <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="organization-phone"
              type="tel"
              placeholder="Enter organization phone number"
              disabled={isSubmitting}
              className="pl-9"
              {...register("phone")}
            />
          </div>

          {errors.phone && (
            <FieldError className="max-w-md">{errors.phone.message}</FieldError>
          )}
        </Field>

        {/* Address */}

        <Field>
          <FieldLabel htmlFor="organization-address">Address</FieldLabel>

          <div className="relative">
            <MapPinIcon className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />

            <Input
              id="organization-address"
              type="text"
              placeholder="Enter organization address"
              disabled={isSubmitting}
              className="pl-9"
              {...register("address")}
            />
          </div>

          {errors.address && (
            <FieldError className="max-w-md">
              {errors.address.message}
            </FieldError>
          )}
        </Field>
      </FieldGroup>

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

export default GeneralSettings;
