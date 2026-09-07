import { notFound } from "next/navigation";

import TeamContent from "@/components/dashboard/Teams/IndividualTeam/TeamContent";
import { getTeamFromId } from "@/server/team/getTeamFromId";
import { getCurrentUserRole } from "@/server/user/getCurrentUserRole";
import { getSession } from "@/server/user/getSession";

type Props = {
  params: Promise<{
    slug: string;
    teamId: string;
  }>;
};

const Team = async ({ params }: Props) => {
  const { teamId } = await params;

  const session = await getSession();

  if (!session?.user) {
    notFound();
  }

  const team = await getTeamFromId(teamId);

  if (!team) {
    notFound();
  }

  const organizationRole = await getCurrentUserRole();

  const isOrganizationAdmin =
    organizationRole === "owner" || organizationRole === "admin";

  const currentUserTeamMember = team.members.find(
    (member) => member.userId === session.user.id,
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