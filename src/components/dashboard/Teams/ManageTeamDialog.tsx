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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { Search, Users } from "lucide-react";
import { toast } from "sonner";

import { updateTeam } from "@/server/team/updateTeam";
import { getInitials } from "@/lib/utils";
import { OrganizationEmployeeRole } from "@/types/organization/team";

type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: OrganizationEmployeeRole;
};

type ManageTeamDialogProps = {
  team: {
    id: string;
    name: string;
  } | null;

  members: TeamMember[];

  open: boolean;

  onOpenChange: (open: boolean) => void;

  onTeamUpdated: (
    teamId: string,
    updates: {
      name: string;
      adminUserIds: string[];
    },
  ) => void;
};

export function ManageTeamDialog({
  team,
  members,
  open,
  onOpenChange,
  onTeamUpdated,
}: ManageTeamDialogProps) {
  const [name, setName] = useState("");

  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------
  // Initialize form
  // --------------------------------------------------

  useEffect(() => {
    if (!team || !open) {
      return;
    }

    setName(team.name);

    setAdminUserIds(
      members
        .filter((member) => member.role === "admin")
        .map((member) => member.userId),
    );

    setSearch("");
  }, [team?.id, open]);

  // --------------------------------------------------
  // Filter members
  // --------------------------------------------------

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return members;
    }

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(value) ||
        member.email.toLowerCase().includes(value),
    );
  }, [members, search]);

  // --------------------------------------------------
  // Select all visible members
  // --------------------------------------------------

  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) => adminUserIds.includes(member.userId));

  const toggleAll = () => {
    setAdminUserIds((current) => {
      if (allFilteredSelected) {
        const visibleUserIds = new Set(
          filteredMembers.map((member) => member.userId),
        );

        return current.filter((id) => !visibleUserIds.has(id));
      }

      const next = new Set(current);

      filteredMembers.forEach((member) => {
        next.add(member.userId);
      });

      return Array.from(next);
    });
  };

  // --------------------------------------------------
  // Toggle individual admin
  // --------------------------------------------------

  const toggleAdmin = (userId: string) => {
    setAdminUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  // --------------------------------------------------
  // Check changes
  // --------------------------------------------------

  const hasChanges = useMemo(() => {
    if (!team) {
      return false;
    }

    const originalAdminUserIds = members
      .filter((member) => member.role === "admin")
      .map((member) => member.userId)
      .sort();

    const currentAdminUserIds = [...adminUserIds].sort();

    const adminsChanged =
      originalAdminUserIds.length !== currentAdminUserIds.length ||
      originalAdminUserIds.some(
        (id, index) => id !== currentAdminUserIds[index],
      );

    const nameChanged = name.trim() !== team.name;

    return nameChanged || adminsChanged;
  }, [team, members, name, adminUserIds]);

  // --------------------------------------------------
  // Save changes
  // --------------------------------------------------

  const handleSave = async () => {
    if (!team || !hasChanges || isSaving) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Team name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const result = await updateTeam({
        teamId: team.id,
        name: trimmedName,
        adminUserIds,
      });

      if (!result.success) {
        console.error("[ManageTeamDialog] updateTeam failed:", result);

        toast.error("Unable to update team", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      onTeamUpdated(team.id, {
        name: result.data.name,
        adminUserIds: result.data.adminUserIds,
      });

      toast.success("Team updated", {
        description: "The team's settings have been updated.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("[ManageTeamDialog] save error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  // Reset when closing
  // --------------------------------------------------

  const handleOpenChange = (value: boolean) => {
    if (isSaving) {
      return;
    }

    onOpenChange(value);

    if (!value) {
      setSearch("");
    }
  };

  if (!team) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Manage team</AlertDialogTitle>

          <AlertDialogDescription>
            Update the team name and assign one or more team admins.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        <div className="space-y-6">
          <FieldGroup className="-space-y-3">
            {/* Team name */}
            <Field>
              <FieldLabel>Team name</FieldLabel>

              <Input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter team name"
                disabled={isSaving}
              />
            </Field>

            {/* Team admins */}
            <Field>
              <FieldLabel>Team admins</FieldLabel>

              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search team members..."
                    disabled={isSaving}
                    className="bg-background pl-9"
                  />
                </div>

                {/* Select all / count */}
                {members.length > 0 && (
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleAll}
                        disabled={isSaving || filteredMembers.length === 0}
                      />

                      <span>Select all</span>
                    </label>

                    <span className="text-sm text-muted-foreground">
                      {adminUserIds.length} selected
                    </span>
                  </div>
                )}

                {/* Members */}
                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  {members.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Users className="size-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm font-medium">No team members</p>

                      <p className="text-xs text-muted-foreground">
                        Add members to this team before assigning team admins.
                      </p>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Users className="size-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm font-medium">No members found</p>

                      <p className="text-xs text-muted-foreground">
                        Try a different name or email address.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMembers.map((member) => {
                        const selected = adminUserIds.includes(member.userId);

                        return (
                          <label
                            key={member.id}
                            className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleAdmin(member.userId)}
                              disabled={isSaving}
                            />

                            <Avatar className="size-9 shrink-0">
                              <AvatarImage
                                src={member.image ?? undefined}
                                alt={member.name}
                              />

                              <AvatarFallback>
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {member.name}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Field>
          </FieldGroup>
        </div>

        {/* Actions */}
        <AlertDialogFooter className="mt-2 flex-row gap-2">
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
            disabled={!hasChanges || isSaving || !name.trim()}
            onClick={() => {
              void handleSave();
            }}
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
