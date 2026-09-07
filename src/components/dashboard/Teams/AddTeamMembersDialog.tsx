"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getAvailableTeamMembers } from "@/server/team/getAvailableTeamMembers";
import { addTeamMembers } from "@/server/team/addTeamMembers";

import type { TeamMember } from "@/server/team/getTeamFromId";
import type { AvailableTeamMember } from "@/server/team/getAvailableTeamMembers";

type AddTeamMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onMembersAdded: (members: TeamMember[]) => void;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const AddTeamMembersDialog = ({
  open,
  onOpenChange,
  teamId,
  onMembersAdded,
}: AddTeamMembersDialogProps) => {
  const [members, setMembers] = useState<AvailableTeamMember[]>([]);

  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );

  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [loadError, setLoadError] = useState(false);

  /*
   * Load organization members that are not already
   * assigned to this team.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const loadMembers = async () => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const result = await getAvailableTeamMembers({
          teamId,
        });

        if (!result.success) {
          setLoadError(true);

          toast.error("Unable to load members", {
            description:
              result.error || "Something went wrong. Please try again.",
          });

          return;
        }

        setMembers(result.data);
      } catch (error) {
        console.error("[AddTeamMembersDialog] load members error:", error);

        setLoadError(true);

        toast.error("Something went wrong", {
          description: "Unable to load organization members.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [open, teamId]);

  /*
   * Filter members by name/email.
   */
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

  /*
   * Check whether all currently visible members are selected.
   */
  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) => selectedMemberIds.has(member.id));

  /*
   * Select / unselect one member.
   */
  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) => {
      const next = new Set(current);

      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }

      return next;
    });
  };

  /*
   * Select / unselect all currently visible members.
   */
  const toggleAll = () => {
    setSelectedMemberIds((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filteredMembers.forEach((member) => {
          next.delete(member.id);
        });
      } else {
        filteredMembers.forEach((member) => {
          next.add(member.id);
        });
      }

      return next;
    });
  };

  /*
   * Add selected members to the team.
   */
  const handleAddMembers = async () => {
    const memberIds = Array.from(selectedMemberIds);

    if (memberIds.length === 0) {
      toast.error("No members selected", {
        description: "Please select at least one member.",
      });

      return;
    }

    setIsAdding(true);

    try {
      const result = await addTeamMembers({
        teamId,
        memberIds,
      });

      if (!result.success) {
        switch (result.code) {
          case "UNAUTHORIZED":
            toast.error("Authentication required", {
              description: result.error || "Please log in and try again.",
            });
            return;

          case "FORBIDDEN":
            toast.error("Permission denied", {
              description:
                result.error ||
                "You don't have permission to manage this team.",
            });
            return;

          case "NOT_FOUND":
            toast.error("Team not found", {
              description: result.error || "The team could not be found.",
            });
            return;

          default:
            toast.error("Unable to add members", {
              description:
                result.error || "Something went wrong. Please try again.",
            });
            return;
        }
      }

      toast.success("Members added", {
        description:
          result.message ||
          `${result.data.addedCount} member${
            result.data.addedCount === 1 ? "" : "s"
          } added to the team.`,
      });

      /*
       * Update the parent table immediately.
       */
      onMembersAdded(result.data.members);

      /*
       * Reset dialog state.
       */
      setSelectedMemberIds(new Set());
      setSearch("");
      setMembers([]);
      setLoadError(false);

      onOpenChange(false);
    } catch (error) {
      console.error("[AddTeamMembersDialog] add members error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  /*
   * Reset state when dialog closes.
   */
  const handleOpenChange = (value: boolean) => {
    if (isAdding) {
      return;
    }

    onOpenChange(value);

    if (!value) {
      setSelectedMemberIds(new Set());
      setSearch("");
      setMembers([]);
      setLoadError(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add team members</AlertDialogTitle>

          <AlertDialogDescription>
            Select employees from your organization to add to this team.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members..."
              disabled={isLoading || isAdding || loadError}
              className="bg-background pl-9"
            />
          </div>

          {/* Member count / Select all */}
          {!isLoading && !loadError && members.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  disabled={isAdding || filteredMembers.length === 0}
                />

                <span>Select all</span>
              </label>

              <span className="text-sm text-muted-foreground">
                {selectedMemberIds.size} selected
              </span>
            </div>
          )}

          {/* Members */}
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  <span>Loading members...</span>
                </div>
              </div>
            ) : loadError ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">Unable to load members</p>

                <p className="text-xs text-muted-foreground">
                  We couldn't load the organization members. Please close this
                  dialog and try again.
                </p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  {search
                    ? "No members found"
                    : "Everyone is already in this team"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {search
                    ? "Try a different name or email address."
                    : "There are no organization members available to add."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMembers.map((member) => {
                  const selected = selectedMemberIds.has(member.id);

                  return (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleMember(member.id)}
                        disabled={isAdding}
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

                        {/* <p className="truncate text-xs text-muted-foreground">
                          {member.email}
                        </p> */}

                        {member.title && (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.title}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected count */}
          {!isLoading && !loadError && selectedMemberIds.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedMemberIds.size} member
              {selectedMemberIds.size === 1 ? "" : "s"} selected
            </p>
          )}
        </div>

        {/* Actions */}
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel
            type="button"
            className="mt-0 flex-1"
            disabled={isAdding}
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            className="flex-1"
            disabled={
              isLoading || isAdding || loadError || selectedMemberIds.size === 0
            }
            onClick={() => {
              void handleAddMembers();
            }}
          >
            {isAdding ? (
              <>
                <Spinner className="size-5" />
                Adding...
              </>
            ) : (
              <>
                Add{" "}
                {selectedMemberIds.size > 0 ? `${selectedMemberIds.size} ` : ""}
                member
                {selectedMemberIds.size === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddTeamMembersDialog;
