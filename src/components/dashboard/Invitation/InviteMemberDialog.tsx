"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";

import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/validators/organization/invite";

import {
  inviteOrganizationMember,
  type InviteMemberSuccess,
} from "@/server/organization/inviteOrganizationMember";

type Team = {
  id: string;
  name: string;
};

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationCreated: (invitation: InviteMemberSuccess) => void;
  teams: Team[];
  defaultTeamId: string | null;
};

const InviteMemberDialog = ({
  open,
  onOpenChange,
  onInvitationCreated,
  teams,
  defaultTeamId,
}: InviteMemberDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      email: "",
      teamId: defaultTeamId ?? "",
      role: "member",
    },
  });

  const teamId = watch("teamId");

  useEffect(() => {
    if (!open) {
      return;
    }

    setValue("teamId", defaultTeamId ?? "", {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [open, defaultTeamId, setValue]);

  const onSubmit = async (values: InviteMemberInput) => {
    console.log("FORM SUBMITTED:", values);

    try {
      const result = await inviteOrganizationMember({
        title: values.title,
        email: values.email,
        teamId: values.teamId,
        role: values.role,
      });

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof InviteMemberInput, {
                type: "server",
                message,
              });
            }
          }
        }

        if (result.code === "LIMIT_REACHED") {
          toast.error("Employee limit reached", {
            description: result.error,
          });

          return;
        }

        if (result.code === "UNAUTHORIZED") {
          toast.error("Authentication required", {
            description:
              result.error || "You must be logged in to send an invitation.",
          });

          return;
        }

        if (result.code === "FORBIDDEN") {
          toast.error("Permission denied", {
            description:
              result.error || "You do not have permission to invite employees.",
          });

          return;
        }

        if (result.code === "TEAM_REQUIRED") {
          toast.error("Team required", {
            description:
              result.error || "Please select a team for the employee.",
          });

          return;
        }

        if (result.code === "TEAM_NOT_FOUND") {
          toast.error("Team not found", {
            description:
              result.error || "The selected team could not be found.",
          });

          return;
        }

        toast.error("Unable to send invitation", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Invitation sent", {
        description: `An invitation has been sent to ${values.email}.`,
      });

      reset({
        email: "",
        title: "",
        teamId: defaultTeamId ?? "",
        role: "member",
      });

      onInvitationCreated(result.data);
      onOpenChange(false);
    } catch (error) {
      console.error("[InviteMemberDialog] error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    console.log("FORM VALIDATION ERRORS:", formErrors);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Invite an employee</AlertDialogTitle>

          <AlertDialogDescription>
            Enter the employee&apos;s email address to send them an invitation
            to join your organization.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <FieldGroup className="-space-y-3">
            {/* Email */}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>

              <Input
                id="email"
                type="email"
                placeholder="employee@example.com"
                autoComplete="email"
                autoFocus
                className="bg-background"
                disabled={isSubmitting}
                {...register("email")}
              />

              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : (
                <FieldDescription>
                  We&apos;ll send an invitation to this email address.
                </FieldDescription>
              )}
            </Field>

            {/* Title */}
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>

              <Input
                id="title"
                type="text"
                placeholder="e.g. Software Engineer"
                className="bg-background"
                disabled={isSubmitting}
                {...register("title")}
              />

              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>

            {/* Team */}
            <Field>
              <FieldLabel htmlFor="team">Team</FieldLabel>

              <Select
                value={teamId}
                onValueChange={(value) => {
                  setValue("teamId", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting || teams.length === 0}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>

                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.teamId && (
                <FieldError>{errors.teamId.message}</FieldError>
              )}
            </Field>

            {/* Role */}
            <Field>
              <FieldLabel htmlFor="role">Organization Role</FieldLabel>

              <Select
                value={watch("role")}
                onValueChange={(value) => {
                  setValue("role", value as "member" | "admin", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>

                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              {errors.role ? (
                <FieldError>{errors.role.message}</FieldError>
              ) : (
                <FieldDescription>
                  Admins can manage organization settings and members.
                </FieldDescription>
              )}
            </Field>

            <AlertDialogFooter className="mt-2 flex-row gap-2">
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
                disabled={isSubmitting || teams.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-5" />
                    Sending...
                  </>
                ) : (
                  "Send invitation"
                )}
              </Button>
            </AlertDialogFooter>
          </FieldGroup>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InviteMemberDialog;
