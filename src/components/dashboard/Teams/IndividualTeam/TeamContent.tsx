"use client";

import { useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import EmptyState from "@/components/shared/dashboard/EmptyState";

import { Plus, Settings2Icon, UsersIcon } from "lucide-react";

import TeamMemberTable from "./TeamMemberTable";

import type { TeamMember } from "@/server/team/getTeamFromId";

import AddTeamMembersDialog from "../AddTeamMembersDialog";
import { ManageTeamDialog } from "../ManageTeamDialog";
import { Button } from "@/components/ui/button";

type TeamContentProps = {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  canManageTeam: boolean;
};

const TeamContent = ({
  teamId,
  teamName,
  members: initialMembers,
  canManageTeam,
}: TeamContentProps) => {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [currentTeamName, setCurrentTeamName] = useState(teamName);

  const [manageTeamDialogOpen, setManageTeamDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  // --------------------------------------------------
  // Remove member
  // --------------------------------------------------

  const handleMemberRemoved = (memberId: string) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  };

  // --------------------------------------------------
  // Update individual member role
  // --------------------------------------------------

  const handleMemberRoleUpdated = (
    memberId: string,
    role: "admin" | "member",
  ) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              role,
            }
          : member,
      ),
    );
  };

  // --------------------------------------------------
  // Add members
  // --------------------------------------------------

  const handleMembersAdded = (newMembers: TeamMember[]) => {
    setMembers((current) => [...current, ...newMembers]);
  };

  // --------------------------------------------------
  // Update team settings
  // --------------------------------------------------

  const handleTeamUpdated = (
    updatedTeamId: string,
    updates: {
      name: string;
      adminUserIds: string[];
    },
  ) => {
    if (updatedTeamId !== teamId) {
      return;
    }

    setCurrentTeamName(updates.name);

    setMembers((current) =>
      current.map((member) => ({
        ...member,
        role: updates.adminUserIds.includes(member.userId) ? "admin" : "member",
      })),
    );
  };

  // --------------------------------------------------
  // Open add member dialog
  // --------------------------------------------------

  const openAddMemberDialog = () => {
    setAddMemberDialogOpen(true);
  };

  // --------------------------------------------------
  // Open manage team dialog
  // --------------------------------------------------

  const openManageTeamDialog = () => {
    setManageTeamDialogOpen(true);
  };

  const hasMembers = members.length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2">
        <DashboardPageHeader
          className="flex-1"
          title={currentTeamName}
          description={
            canManageTeam
              ? "Manage employees assigned to this team."
              : "View employees assigned to this team."
          }
          {...(canManageTeam && hasMembers
            ? {
                actionIcon: <Plus className="size-4" />,
                actionLabel: "Add members",
                onAction: openAddMemberDialog,
              }
            : {})}
        />

        {canManageTeam && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openManageTeamDialog}
            aria-label="Manage team"
            title="Manage team"
          >
            <Settings2Icon className="size-4" />
          </Button>
        )}
      </div>

      {/* Team members */}
      {hasMembers ? (
        <TeamMemberTable
          teamId={teamId}
          members={members}
          canManageTeam={canManageTeam}
          onMemberRemoved={handleMemberRemoved}
          onMemberRoleUpdated={handleMemberRoleUpdated}
        />
      ) : canManageTeam ? (
        <EmptyState
          icon={<UsersIcon className="size-6 text-muted-foreground" />}
          title="No members yet"
          description="There are no employees assigned to this team yet."
          actionIcon={<Plus className="size-4" />}
          actionLabel="Add members"
          onAction={openAddMemberDialog}
        />
      ) : (
        <EmptyState
          icon={<UsersIcon className="size-6 text-muted-foreground" />}
          title="No members yet"
          description="There are no employees assigned to this team yet."
        />
      )}

      {/* Add members */}
      {canManageTeam && (
        <AddTeamMembersDialog
          open={addMemberDialogOpen}
          onOpenChange={setAddMemberDialogOpen}
          teamId={teamId}
          onMembersAdded={handleMembersAdded}
        />
      )}

      {/* Manage team */}
      {canManageTeam && (
        <ManageTeamDialog
          team={{
            id: teamId,
            name: currentTeamName,
          }}
          members={members}
          open={manageTeamDialogOpen}
          onOpenChange={setManageTeamDialogOpen}
          onTeamUpdated={handleTeamUpdated}
        />
      )}
    </>
  );
};

export default TeamContent;
