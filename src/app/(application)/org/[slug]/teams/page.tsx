import AllTeamsContent from "@/components/dashboard/Teams/AllTeams/allTeamsContent";
import { getTeamsPageData } from "@/server/team/getTeamsPageData";

const Teams = async () => {
  const data = await getTeamsPageData();

  if (!data) {
    return null;
  }

  return (
    <AllTeamsContent initialTeams={data.teams} organizationRole={data.role} />
  );
};

export default Teams;
