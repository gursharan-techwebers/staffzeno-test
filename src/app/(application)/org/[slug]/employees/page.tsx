import { redirect } from "next/navigation";

import { getOrganizationEmployees } from "@/server/organization/getOrganizationEmployees";
import { getActiveOrganization } from "@/server/organization/getActiveOrganization";
import { getUserOrganizationRole } from "@/server/organization/getUserOrganizationRole";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";

import EmployeeContent from "@/components/dashboard/Employees/EmployeeContent";

const Employees = async () => {
  const [employeesResult, organization, roleResult, teams] = await Promise.all([
    getOrganizationEmployees(),
    getActiveOrganization(),
    getUserOrganizationRole(),
    getOrganizationTeams(),
  ]);

  // --------------------------------------------------
  // Unauthorized / invalid organization
  // --------------------------------------------------
  if (!employeesResult.success || !organization) {
    redirect(`/org/${organization?.slug ?? ""}`);
  }

  // --------------------------------------------------
  // Missing organization role
  // --------------------------------------------------
  if (!roleResult.success) {
    return null;
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
    redirect(`/`);
  }

  return (
    <EmployeeContent
      employees={employeesResult.data}
      teams={employeeTeams}
      organizationId={organization.id}
      currentUserRole={roleResult.data}
      defaultTeamId={defaultTeamId}
    />
  );
};

export default Employees;
