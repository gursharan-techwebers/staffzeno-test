"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  Trash2Icon,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { TeamMember } from "@/server/team/getTeamFromId";
import { Badge } from "@/components/ui/badge";
import { updateTeamMemberRole } from "@/server/team/updateTeamMemberRole";
import { removeTeamMember } from "@/server/team/removeTeamMember";
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "../../UserProfile";
import UserNameAndTitle from "@/components/shared/dashboard/UserNameAndTitle";

type TeamMemberTableProps = {
  teamId: string;
  members: TeamMember[];
  canManageTeam: boolean;
  onMemberRemoved?: (memberId: string) => void;
  onMemberRoleUpdated?: (memberId: string, role: "admin" | "member") => void;
};

const formatDate = (date: Date | null) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

export default function TeamMemberTable({
  teamId,
  members,
  canManageTeam,
  onMemberRemoved,
  onMemberRoleUpdated,
}: TeamMemberTableProps) {
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const [actionId, setActionId] = useState<string | null>(null);

  // --------------------------------------------------
  // Remove Team Member
  // --------------------------------------------------

  const handleRemoveMember = async (memberId: string) => {
    setActionId(memberId);

    try {
      const result = await removeTeamMember({
        teamId,
        memberId,
      });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          toast.error("Authentication required", {
            description: result.error || "Please log in and try again.",
          });

          return;
        }

        if (result.code === "FORBIDDEN") {
          toast.error("Permission denied", {
            description:
              result.error ||
              "You don't have permission to remove team members.",
          });

          return;
        }

        if (result.code === "NOT_FOUND") {
          toast.error("Member not found", {
            description: result.error || "The team member could not be found.",
          });

          return;
        }

        toast.error("Unable to remove member", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Member removed", {
        description: "The employee has been removed from this team.",
      });

      onMemberRemoved?.(memberId);
      setMemberToRemove(null);
    } catch (error) {
      console.error("[TeamMemberTable] remove member error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  // --------------------------------------------------
  // Update Team Member Role
  // --------------------------------------------------

  const handleRoleChange = async (
    member: TeamMember,
    role: "admin" | "member",
  ) => {
    if (member.role === role) {
      return;
    }

    setActionId(member.id);

    try {
      const result = await updateTeamMemberRole({
        teamId,
        memberId: member.id,
        role,
      });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          toast.error("Authentication required", {
            description: result.error || "Please log in and try again.",
          });

          return;
        }

        if (result.code === "FORBIDDEN") {
          toast.error("Permission denied", {
            description:
              result.error ||
              "You don't have permission to update team member roles.",
          });

          return;
        }

        if (result.code === "NOT_FOUND") {
          toast.error("Member not found", {
            description: result.error || "The team member could not be found.",
          });

          return;
        }

        toast.error("Unable to update role", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Role updated", {
        description: `${member.name}'s team role has been updated.`,
      });

      onMemberRoleUpdated?.(member.id, role);
    } catch (error) {
      console.error("[TeamMemberTable] update role error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-medium">Employee</TableHead>

              <TableHead className="font-medium">Team Role</TableHead>

              <TableHead className="font-medium">Joined</TableHead>

              {canManageTeam && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.id}
                className="transition-colors hover:bg-muted/30"
              >
                {/* Employee */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserProfile user={member} title={member.title || ""}/>
                    <UserNameAndTitle
                      name={member.name}
                      title={member.title || ""}
                    />
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      member.role === "admin"
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                        : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
                    }
                  >
                    {member.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </TableCell>

                {/* Joined */}
                <TableCell className="text-muted-foreground">
                  {formatDate(member.createdAt)}
                </TableCell>

                {/* Actions */}
                {canManageTeam && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={actionId === member.id}
                        >
                          <MoreHorizontalIcon className="size-4" />

                          <span className="sr-only">Open member actions</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          disabled={actionId === member.id}
                          onSelect={() => {
                            void handleRoleChange(
                              member,
                              member.role === "admin" ? "member" : "admin",
                            );
                          }}
                        >
                          <User className="size-4" />

                          <span>
                            Make Team{" "}
                            {member.role === "admin" ? "Member" : "Admin"}
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="destructive"
                          disabled={actionId === member.id}
                          onSelect={() => setMemberToRemove(member)}
                        >
                          <Trash2Icon className="size-4" />

                          <span>Remove From Team</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => {
          if (!open && !actionId) {
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from team?</AlertDialogTitle>

            <AlertDialogDescription>
              This will remove the following employee from this team. They will
              remain a member of your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          {memberToRemove && (
            <div className="rounded-lg">
              <div className="flex items-center gap-3">
                <UserProfile user={memberToRemove} title={memberToRemove.title || ""}/>

                <UserNameAndTitle
                  name={memberToRemove.name}
                  title={memberToRemove.title || ""}
                />
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-2 flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1" disabled={!!actionId}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="flex-1"
              disabled={!!actionId}
              onClick={async () => {
                if (!memberToRemove) {
                  return;
                }

                await handleRemoveMember(memberToRemove.id);
              }}
            >
              {actionId === memberToRemove?.id ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
