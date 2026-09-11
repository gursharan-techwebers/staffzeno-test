"use client";

import { useState } from "react";
import { Plus, UsersIcon } from "lucide-react";

import { DashboardPageHeader } from "../../dashboardPageHeader";
import { AllTeamsTable } from "./allTeamsTable";
import EmptyState from "@/components/shared/dashboard/EmptyState";
import CreateTeamDialog from "../CreateTeamDialog";
import type { OrganizationRole } from "@/server/user/getCurrentUserRole";
import { Team } from "@/types/organization/team";

type TeamsContentProps = {
  initialTeams: Team[];
  organizationRole: OrganizationRole | null;
};

const AllTeamsContent = ({
  initialTeams,
  organizationRole,
}: TeamsContentProps) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Only organization owner/admin can manage teams
  const canManageTeams =
    organizationRole === "owner" || organizationRole === "admin";

  const handleTeamCreated = (team: Team) => {
    setTeams((current) => [team, ...current]);
  };

  const handleTeamRemoved = (teamId: string) => {
    setTeams((current) => current.filter((team) => team.id !== teamId));
  };

  const handleTeamUpdated = (
    teamId: string,
    updates: {
      name: string;
      adminUserIds: string[];
    },
  ) => {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              name: updates.name,
              members: team.members.map((member) => ({
                ...member,
                role: updates.adminUserIds.includes(member.userId)
                  ? "admin"
                  : "member",
              })),
            }
          : team,
      ),
    );
  };

  return (
    <>
      <DashboardPageHeader
        title="Teams"
        description={
          canManageTeams
            ? "Create and manage teams within your organization."
            : "View the teams you are a member of."
        }
        {...(canManageTeams && teams.length > 0
          ? {
              actionIcon: <Plus className="size-4" />,
              actionLabel: "Create team",
              onAction: () => setCreateDialogOpen(true),
            }
          : {})}
      />

      {teams.length > 0 ? (
        <AllTeamsTable
          teams={teams}
          canManageTeams={canManageTeams}
          onTeamRemoved={canManageTeams ? handleTeamRemoved : undefined}
          onTeamUpdated={canManageTeams ? handleTeamUpdated : undefined}
        />
      ) : canManageTeams ? (
        <EmptyState
          icon={<UsersIcon className="size-4" />}
          title="No teams yet"
          description="Create your first team to organize employees within your organization."
          actionIcon={<Plus className="size-5" />}
          actionLabel="Create team"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <EmptyState
          icon={<UsersIcon className="size-4" />}
          title="You are not in any team"
          description="You are not currently a member of any team in this organization."
        />
      )}

      {canManageTeams && (
        <CreateTeamDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </>
  );
};

export default AllTeamsContent;
