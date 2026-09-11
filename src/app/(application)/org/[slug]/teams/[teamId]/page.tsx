import { notFound, redirect } from "next/navigation";

import TeamContent from "@/components/dashboard/Teams/IndividualTeam/TeamContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getTeamFromId } from "@/server/team/getTeamFromId";

type Props = {
  params: Promise<{
    slug: string;
    teamId: string;
  }>;
};

const Team = async ({ params }: Props) => {
  const { slug, teamId } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    notFound();
  }

  const { organization, user, membership } = dashboard.data;

  const team = await getTeamFromId({
    teamId,
    organizationId: organization.id,
  });

  if (!team) {
    notFound();
  }

  const isOrganizationAdmin =
    membership.role === "owner" || membership.role === "admin";

  const currentUserTeamMember = team.members.find(
    (member) => member.userId === user.id,
  );

  // Only organization owner/admin can manage teams.
  // Team Admin does NOT get management permissions.
  const canManageTeam = isOrganizationAdmin;

  // User can view the team if:
  // - they are an organization owner/admin, OR
  // - they are a member of this team.
  const canViewTeam =
    isOrganizationAdmin || currentUserTeamMember !== undefined;

  if (!canViewTeam) {
    notFound();
  }

  return (
    <TeamContent
      teamId={team.id}
      teamName={team.name}
      members={team.members}
      canManageTeam={canManageTeam}
    />
  );
};

export default Team;
