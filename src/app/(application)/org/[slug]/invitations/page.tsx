import InvitationContent from "@/components/dashboard/Invitation/InvitationContent";
import { getUserInvitations } from "@/server/user/getUserInvitations";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";
import { redirect } from "next/navigation";

const Invitations = async () => {
  const [result, teams] = await Promise.all([
    getUserInvitations(),
    getOrganizationTeams(),
  ]);

  if (!result.success) {
    redirect(`/`);
  }

  const employeeTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
  }));

  // The organization-created team is currently assumed
  const defaultTeamId = employeeTeams.at(-1)?.id;

  if (!defaultTeamId) {
    redirect(`/`);
  }

  return (
    <InvitationContent
      invitations={result.data.sent}
      teams={employeeTeams}
      defaultTeamId={defaultTeamId}
    />
  );
};

export default Invitations;
