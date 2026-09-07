export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const labelMap: Record<string, string> = {
  attendance: "Attendance",
  leave: "Leave",
  payroll: "Payroll",
  calendar: "Calendar",
  employees: "Employees",
  invitations: "Invitations",
  reports: "Reports",
  settings: "Settings",
  account: "Account",
  organization: "Organization",
  teams: "Teams",
};

const formatLabel = (segment: string) => {
  return (
    labelMap[segment.toLowerCase()] ??
    segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

export function createBreadcrumbs(
  pathname: string,
  organizationName: string,
  teamName?: string,
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  const routeSegments = segments[0] === "org" ? segments.slice(2) : segments;

  const breadcrumbs: BreadcrumbItem[] = [];

  breadcrumbs.push({
    label: organizationName,
    href:
      segments[0] === "org" && segments[1] ? `/org/${segments[1]}` : undefined,
  });

  let currentPath =
    segments[0] === "org" && segments[1] ? `/org/${segments[1]}` : "";

  routeSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    let label = formatLabel(segment);

    if (routeSegments[index - 1]?.toLowerCase() === "teams" && teamName) {
      label = teamName;
    }

    breadcrumbs.push({
      label,
      href: index === routeSegments.length - 1 ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
