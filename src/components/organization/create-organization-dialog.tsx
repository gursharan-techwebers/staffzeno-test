"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/validators/organization/organization";

import { createOrganization } from "@/server/organization/createOrganization";
import { Separator } from "../ui/separator";
import { useState } from "react";

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateOrganizationDialog = ({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) => {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (values: CreateOrganizationInput) => {
    try {
      const result = await createOrganization(values);

      if (!result.success) {
        // Handle field-level validation errors
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof CreateOrganizationInput, {
                type: "server",
                message,
              });
            }
          }
        }

        // Handle specific server error codes
        if (result.code === "LIMIT_REACHED") {
          toast.error("Organization limit reached", {
            description:
              result.error ||
              "You have reached the organization limit for your current plan.",
          });

          return;
        }

        toast.error("Unable to create organization", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Organization created", {
        description: "Your organization has been created successfully.",
      });
      setRedirecting(true);
      router.push(`/org/${result.data.slug}`);
    } catch (error) {
      console.error("[CreateOrganizationDialog] error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
      setRedirecting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        {redirecting ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-4">
            <Spinner className="size-5 md:size-8" />

            <p className="text-sm md:text-base text-muted-foreground">
              Opening your organization...
            </p>
          </div>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Create your organization</AlertDialogTitle>

              <AlertDialogDescription>
                Create your company workspace to get started with StaffZeno.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Separator />

            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                {/* Organization Name */}
                <Field>
                  <FieldLabel htmlFor="organizationName">
                    Organization name
                  </FieldLabel>

                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Acme Technologies"
                    autoComplete="organization"
                    autoFocus
                    disabled={isSubmitting}
                    className="bg-background"
                    {...register("name")}
                  />

                  {errors.name && (
                    <FieldError>{errors.name.message}</FieldError>
                  )}
                </Field>

                {/* Actions */}
                <AlertDialogFooter className="flex-row gap-2">
                  <AlertDialogCancel
                    type="button"
                    className="mt-0 flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </AlertDialogCancel>

                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="size-5" />
                        Creating...
                      </>
                    ) : (
                      "Create organization"
                    )}
                  </Button>
                </AlertDialogFooter>
              </FieldGroup>
            </form>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateOrganizationDialog;
