import { AppSidebar } from "@/components/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboardBreadcrumb";
import { Separator } from "@/components/ui/separator";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";
import { getUserTeams } from "@/server/team/getUserTeams";
import { getOrganizationTeams } from "@/server/team/getOrganizationTeams";

import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

const DashboardLayout = async ({ children, params }: Props) => {
  const { slug } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { session, organization, membership } = dashboard.data;

  const canManageTeams =
    membership.role === "owner" || membership.role === "admin";

  const [allUserOrganizations, teams] = await Promise.all([
    getUserOrganizations(),
    canManageTeams ? getOrganizationTeams() : getUserTeams(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar
        organization={organization}
        allUserOrganizations={allUserOrganizations}
        organizationSlug={organization.slug}
        user={session.user}
        teams={teams}
        role={membership.role}
      />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />

            <DashboardBreadcrumb
              organizationName={organization.name}
              teams={teams}
            />
          </div>
        </header>

        <div className="mt-4 flex flex-1 flex-col gap-4 p-5 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
