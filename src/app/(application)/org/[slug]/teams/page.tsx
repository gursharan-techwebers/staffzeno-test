import { notFound, redirect } from "next/navigation";

import AllTeamsContent from "@/components/dashboard/Teams/AllTeams/allTeamsContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getTeamsPageData } from "@/server/team/getTeamsPageData";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Teams = async ({ params }: Props) => {
  const { slug } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    notFound();
  }

  const { organization, user, membership } = dashboard.data;

  const data = await getTeamsPageData({
    organizationId: organization.id,
    userId: user.id,
    role: membership.role,
  });

  return (
    <AllTeamsContent initialTeams={data.teams} organizationRole={data.role} />
  );
};

export default Teams;
