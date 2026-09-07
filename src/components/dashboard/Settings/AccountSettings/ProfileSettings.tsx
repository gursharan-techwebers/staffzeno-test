"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailIcon, PhoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { getInitials } from "@/lib/utils";
import {
  updateAccountProfileSchema,
  type UpdateAccountProfileInput,
} from "@/validators/auth/account";
import { updateAccountProfile } from "@/server/user/updateAccountProfile";

type ProfileSettingsProps = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image?: string | null;
  };
};

const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateAccountProfileInput>({
    resolver: zodResolver(updateAccountProfileSchema),
    mode: "onSubmit",
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
    },
  });

  // --------------------------------------------------
  // Initialize form when user changes
  // --------------------------------------------------

  useEffect(() => {
    reset({
      name: user.name,
      phone: user.phone ?? "",
    });
  }, [user, reset]);

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const onSubmit = async (values: UpdateAccountProfileInput) => {
    if (!isDirty || isSubmitting) {
      return;
    }

    try {
      const result = await updateAccountProfile(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof UpdateAccountProfileInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Profile Update Failed", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Profile Updated", {
        description:
          result.message || "Your profile information has been updated.",
      });

      // Mark the saved values as the new clean form state.
      reset(values);
    } catch (error) {
      console.error("[ProfileSettings] save error:", error);

      toast.error("Profile Update Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      {/* Profile header */}

      <div>
        <h3 className="text-base font-semibold">Profile</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <Separator />

      {/* User */}

      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />

          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>

          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <FieldGroup className="-space-y-3">
        {/* Name */}

        <Field>
          <FieldLabel htmlFor="account-name">Name</FieldLabel>

          <Input
            id="account-name"
            type="text"
            placeholder="Enter your name"
            disabled={isSubmitting}
            {...register("name")}
          />

          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        {/* Email */}

        <Field>
          <FieldLabel htmlFor="account-email">Email</FieldLabel>

          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="account-email"
              type="email"
              value={user.email}
              disabled
              className="pl-9"
            />
          </div>

          <FieldDescription>
            Your email address is used for signing in and cannot be changed.
          </FieldDescription>
        </Field>

        {/* Phone */}

        <Field>
          <FieldLabel htmlFor="account-phone">Phone</FieldLabel>

          <div className="relative">
            <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="account-phone"
              type="tel"
              placeholder="Enter your phone number"
              disabled={isSubmitting}
              className="pl-9"
              {...register("phone")}
            />
          </div>

          {errors.phone && (
            <FieldError className="max-w-md">{errors.phone.message}</FieldError>
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

export default ProfileSettings;
