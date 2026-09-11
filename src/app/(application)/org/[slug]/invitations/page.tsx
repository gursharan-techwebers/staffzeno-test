import { redirect } from "next/navigation";

import InvitationContent from "@/components/dashboard/Invitation/InvitationContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getUserInvitations } from "@/server/user/getUserInvitations";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Invitations = async ({ params }: Props) => {
  const { slug } = await params;

  // --------------------------------------------------
  // Resolve authentication + organization + membership
  // --------------------------------------------------
  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization, user } = dashboard.data;

  // --------------------------------------------------
  // Load invitations and teams in parallel
  // --------------------------------------------------
  const [result, teams] = await Promise.all([
    getUserInvitations({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
    }),

    getOrganizationTeams({
      organizationId: organization.id,
    }),
  ]);

  // --------------------------------------------------
  // Invitations failed
  // --------------------------------------------------
  if (!result.success) {
    redirect(`/org/${organization.slug}`);
  }

  // --------------------------------------------------
  // Prepare teams for client component
  // --------------------------------------------------
  const employeeTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
  }));

  const defaultTeamId = employeeTeams.at(-1)?.id;

  if (!defaultTeamId) {
    redirect("/");
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
