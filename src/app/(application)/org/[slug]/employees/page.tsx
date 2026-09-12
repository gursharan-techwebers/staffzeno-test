import { redirect } from "next/navigation";

import EmployeeContent from "@/components/dashboard/Employees/EmployeeContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationEmployees } from "@/server/organization/getOrganizationEmployees";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Employees = async ({ params }: Props) => {
  const pageStart = Date.now();

  const { slug } = await params;

  // --------------------------------------------------
  // Resolve authentication + organization + membership
  // --------------------------------------------------
  const dashboard = await getDashboardContext(slug);

  console.log(
    "[STAFFZENO] Employees - getDashboardContext:",
    Date.now() - pageStart,
    "ms",
  );

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization, membership } = dashboard.data;

  // --------------------------------------------------
  // Load employee page data in parallel
  // --------------------------------------------------
  const dataStart = Date.now();

  const [employeesResult, teams] = await Promise.all([
    getOrganizationEmployees({
      organizationId: organization.id,
      userRole: membership.role,
    }),

    getOrganizationTeams({
      organizationId: organization.id,
    }),
  ]);

  console.log(
    "[STAFFZENO] Employees - page data:",
    Date.now() - dataStart,
    "ms",
  );

  // --------------------------------------------------
  // Employee loading failed
  // --------------------------------------------------
  if (!employeesResult.success) {
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

  console.log(
    "[STAFFZENO] Employees - TOTAL before render:",
    Date.now() - pageStart,
    "ms",
  );

  return (
    <EmployeeContent
      employees={employeesResult.data}
      teams={employeeTeams}
      organizationId={organization.id}
      currentUserRole={membership.role}
      defaultTeamId={defaultTeamId}
    />
  );
};

export default Employees;
