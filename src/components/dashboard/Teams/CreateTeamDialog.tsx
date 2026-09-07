"use client";

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
  createTeamSchema,
  type CreateTeamInput,
} from "@/validators/organization/team";

import { createTeam } from "@/server/team/createTeam";
import { Separator } from "@/components/ui/separator";
import { Team } from "@/types/team/team";

type CreateTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: (team: Team) => void;
};

const CreateTeamDialog = ({
  open,
  onOpenChange,
  onTeamCreated,
}: CreateTeamDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (values: CreateTeamInput) => {
    try {
      const result = await createTeam(values);

      if (!result.success) {
        // Handle field-level validation errors
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof CreateTeamInput, {
                type: "server",
                message,
              });
            }
          }
        }

        // Team limit reached
        if (result.code === "LIMIT_REACHED") {
          toast.error("Team limit reached", {
            description: result.error,
          });

          return;
        }

        // User is not authenticated
        if (result.code === "UNAUTHORIZED") {
          toast.error("Authentication required", {
            description:
              result.error || "You must be logged in to create a team.",
          });

          return;
        }

        // User does not have permission
        if (result.code === "FORBIDDEN") {
          toast.error("Permission denied", {
            description:
              result.error || "You do not have permission to create a team.",
          });

          return;
        }

        // General error
        toast.error("Unable to create team", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Team created", {
        description: "The team has been created successfully.",
      });

      onTeamCreated(result.data);

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("[CreateTeamDialog] error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (isSubmitting) return;

        onOpenChange(value);

        if (!value) {
          reset();
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Create a team</AlertDialogTitle>

          <AlertDialogDescription>
            Create a team to organize employees within your organization.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator/>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Team Name */}
            <Field>
              <FieldLabel htmlFor="teamName">Team name</FieldLabel>

              <Input
                id="teamName"
                type="text"
                placeholder="Engineering"
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
                className="bg-background"
                {...register("name")}
              />

              {errors.name && <FieldError>{errors.name.message}</FieldError>}
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

              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="size-5" />
                    Creating...
                  </>
                ) : (
                  "Create team"
                )}
              </Button>
            </AlertDialogFooter>
          </FieldGroup>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateTeamDialog;
