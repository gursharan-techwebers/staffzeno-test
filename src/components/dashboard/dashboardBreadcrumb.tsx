"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { createBreadcrumbs } from "@/lib/createBreadcrumbs";
import { DashboardLink } from "./DashboardLink";

type DashboardBreadcrumbProps = {
  organizationName: string;
  teams: {
    id: string;
    name: string;
  }[];
};

export function DashboardBreadcrumb({
  organizationName,
  teams,
}: DashboardBreadcrumbProps) {
  const pathname = usePathname();

  const teamId = pathname.match(/\/teams\/([^/]+)/)?.[1];

  const teamName = teams.find((team) => team.id === teamId)?.name;

  const breadcrumbs = createBreadcrumbs(pathname, organizationName, teamName);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={`${breadcrumb.label}-${index}`} className="contents">
              {index > 0 && <BreadcrumbSeparator />}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : breadcrumb.href ? (
                  <DashboardLink href={breadcrumb.href}>
                    {breadcrumb.label}
                  </DashboardLink>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href}>
                    {breadcrumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
