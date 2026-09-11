"use client";

import { useEffect, useMemo, useState } from "react";

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
import { Spinner } from "@/components/ui/spinner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UsersIcon } from "lucide-react";

import { toast } from "sonner";

import { updateOrganizationEmployee } from "@/server/organization/updateOrganizationEmployee";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { TitleSchemaInput } from "@/validators/organization/common";
import { UserProfile } from "../UserProfile";
import UserNameAndTitle from "@/components/shared/dashboard/UserNameAndTitle";
import {
  OrganizationEmployee,
  OrganizationEmployeeRole,
  TeamOption,
} from "@/types/organization/team";

type ManageEmployeeDialogProps = {
  employee: OrganizationEmployee | null;
  organizationId: string;
  teams: TeamOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeUpdated: (
    memberId: string,
    updates: {
      role: OrganizationEmployeeRole;
      teamId: string | null;
      title: TitleSchemaInput;
    },
  ) => void;
};

export function ManageEmployeeDialog({
  employee,
  organizationId,
  teams = [],
  open,
  onOpenChange,
  onEmployeeUpdated,
}: ManageEmployeeDialogProps) {
  const [role, setRole] = useState<OrganizationEmployeeRole>("member");

  const [title, setTitle] = useState<TitleSchemaInput>("");

  const [teamId, setTeamId] = useState<string>("none");

  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------
  // Initialize form when employee changes
  // --------------------------------------------------
  useEffect(() => {
    if (!employee || !open) {
      return;
    }

    setRole(employee.role);
    setTeamId(employee.teamId ?? "none");
    setTitle(employee.title ?? "");
  }, [employee, open]);

  // --------------------------------------------------
  // Check whether anything changed
  // --------------------------------------------------
  const hasChanges = useMemo(() => {
    if (!employee) {
      return false;
    }

    const originalTeamId = employee.teamId ?? "none";

    const originalTitle = employee.title ?? "";

    return (
      role !== employee.role ||
      teamId !== originalTeamId ||
      title !== originalTitle
    );
  }, [employee, role, teamId, title]);

  // --------------------------------------------------
  // Save changes
  // --------------------------------------------------
  const handleSave = async () => {
    if (!employee || !hasChanges || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const selectedTeamId = teamId === "none" ? null : teamId;

      const result = await updateOrganizationEmployee({
        organizationId,
        memberId: employee.id,
        role,
        teamId: selectedTeamId,
        title,
      });

      if (!result.success) {
        toast.error("Unable to update employee", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      // Update employee in parent state
      onEmployeeUpdated(employee.id, {
        role: result.data.role,
        teamId: result.data.teamId,
        title,
      });

      toast.success("Employee updated", {
        description: "The employee's settings have been updated.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[ManageEmployeeDialog] save error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Manage employee</AlertDialogTitle>

          <AlertDialogDescription>
            Update this employee&apos;s title, role and team assignment.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Employee */}
          <div className="rounded-lg">
            <div className="flex items-center gap-3">
              <UserProfile user={employee.user} title={employee.title || ""} />
              <UserNameAndTitle
                name={employee.user.name}
                title={employee.title || ""}
              />
            </div>
          </div>

          <FieldGroup className="-space-y-3">
            {/* Title */}
            <Field>
              <FieldLabel>Title</FieldLabel>

              <Input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter employee title"
                disabled={isSaving}
              />
            </Field>

            {/* Role */}
            <Field>
              <FieldLabel>Organization Role</FieldLabel>

              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as OrganizationEmployeeRole)
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>

                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Team */}
            <Field>
              <FieldLabel>Team</FieldLabel>

              <Select
                value={teamId}
                onValueChange={setTeamId}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="size-4" />
                      No team
                    </div>
                  </SelectItem>

                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>

        <AlertDialogFooter className="flex-row gap-2 mt-2">
          <AlertDialogCancel
            type="button"
            className="mt-0 flex-1"
            disabled={isSaving}
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            className="flex-1"
            disabled={!hasChanges || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                <Spinner className="size-5" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
