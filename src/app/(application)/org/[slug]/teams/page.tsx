import AllTeamsContent from "@/components/dashboard/Teams/AllTeams/allTeamsContent";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";
import { getUserTeams } from "@/server/team/getUserTeams";
import { getCurrentUserRole } from "@/server/user/getCurrentUserRole";

const Teams = async () => {
  const role = await getCurrentUserRole();

  const canManageTeams = role === "owner" || role === "admin";

  const teams = canManageTeams
    ? await getOrganizationTeams()
    : await getUserTeams();

  return <AllTeamsContent initialTeams={teams} organizationRole={role} />;
};

export default Teams;
