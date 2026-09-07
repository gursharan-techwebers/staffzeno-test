"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MoreHorizontalIcon,
  ShieldCheckIcon,
  UsersIcon,
  Trash2Icon,
  Settings2Icon,
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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { removeTeam } from "@/server/team/removeTeam";
import { ManageTeamDialog } from "../ManageTeamDialog";

import { Team } from "@/types/team/team";

type TeamTableProps = {
  teams: Team[];
  canManageTeams: boolean;
  onTeamRemoved?: (teamId: string) => void;
  onTeamUpdated?: (
    teamId: string,
    updates: {
      name: string;
      adminUserIds: string[];
    },
  ) => void;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function AllTeamsTable({
  teams,
  canManageTeams,
  onTeamRemoved,
  onTeamUpdated,
}: TeamTableProps) {
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const [teamToManage, setTeamToManage] = useState<Team | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const { slug } = useParams() as { slug: string };

  // --------------------------------------------------
  // Remove team
  // --------------------------------------------------

  const handleRemoveTeam = async (teamId: string) => {
    setActionId(teamId);

    try {
      const result = await removeTeam(teamId);

      if (!result.success) {
        toast.error("Unable to remove team", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Team removed", {
        description: "The team has been removed successfully.",
      });

      onTeamRemoved?.(teamId);
      setTeamToRemove(null);
    } catch (error) {
      console.error("[AllTeamsTable] remove team error:", error);

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
              <TableHead className="font-medium">Team</TableHead>

              <TableHead className="font-medium">Members</TableHead>

              <TableHead className="font-medium">Team Admin</TableHead>

              <TableHead className="font-medium">Created</TableHead>

              {canManageTeams && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {teams.map((team) => {
              const admins = team.members.filter(
                (member) => member.role === "admin",
              );

              const primaryAdmin = admins[0];

              return (
                <TableRow
                  key={team.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  {/* Team */}
                  <TableCell>
                    <div className="min-w-0">
                      <Link
                        href={`/org/${slug}/teams/${team.id}`}
                        className="truncate font-medium"
                      >
                        {team.name}
                      </Link>
                    </div>
                  </TableCell>

                  {/* Members */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UsersIcon className="size-4" />

                      <span>
                        {team.memberCount}{" "}
                        {team.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Team Admin */}
                  <TableCell>
                    {primaryAdmin ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage
                            src={primaryAdmin.image ?? undefined}
                            alt={primaryAdmin.name}
                          />

                          <AvatarFallback>
                            {getInitials(primaryAdmin.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {primaryAdmin.name}
                          </p>

                          {admins.length > 1 && (
                            <p className="text-xs text-muted-foreground">
                              +{admins.length - 1} more
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheckIcon className="size-4" />

                        <span>No admin assigned</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Created */}
                  <TableCell className="text-muted-foreground">
                    {formatDate(team.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  {canManageTeams && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={actionId === team.id}
                          >
                            <MoreHorizontalIcon className="size-4" />

                            <span className="sr-only">Open team actions</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          {/* Manage */}
                          <DropdownMenuItem
                            onSelect={() => {
                              setTeamToManage(team);
                            }}
                          >
                            <Settings2Icon className="size-4" />
                            <span>Manage</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Remove */}
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setTeamToRemove(team);
                            }}
                          >
                            <Trash2Icon className="size-4" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Manage Team */}

      {canManageTeams && (
        <ManageTeamDialog
          team={teamToManage}
          members={teamToManage?.members ?? []}
          open={!!teamToManage}
          onOpenChange={(open) => {
            if (!open) {
              setTeamToManage(null);
            }
          }}
          onTeamUpdated={(updatedTeamId, updates) => {
            onTeamUpdated?.(updatedTeamId, updates);

            setTeamToManage((current) => {
              if (!current || current.id !== updatedTeamId) {
                return current;
              }

              return {
                ...current,
                name: updates.name,
                members: current.members.map((member) => ({
                  ...member,
                  role: updates.adminUserIds.includes(member.userId)
                    ? "admin"
                    : "member",
                })),
              };
            });
          }}
        />
      )}

      {/* Remove Team Confirmation */}

      {canManageTeams && (
        <AlertDialog
          open={!!teamToRemove}
          onOpenChange={(open) => {
            if (!open && !actionId) {
              setTeamToRemove(null);
            }
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove team?</AlertDialogTitle>

              <AlertDialogDescription>
                This will permanently remove the following team from your
                organization.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Separator />

            {teamToRemove && (
              <div className="rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                    <UsersIcon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{teamToRemove.name}</p>

                    <p className="truncate text-sm text-muted-foreground">
                      {teamToRemove.memberCount}{" "}
                      {teamToRemove.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
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
                  if (!teamToRemove) {
                    return;
                  }

                  await handleRemoveTeam(teamToRemove.id);
                }}
              >
                {actionId === teamToRemove?.id ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
