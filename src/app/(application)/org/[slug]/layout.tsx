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

import { redirect } from "next/navigation";
import { Suspense } from "react";

import DashboardContentSkeleton from "@/components/dashboard/DashboardContentSkeleton";
import TopLoadingBar from "@/components/TopLoadingBar";
import { getSidebarTeams } from "@/server/team/getSidebarTeams";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

const DashboardLayout = async ({ children, params }: Props) => {
  const { slug } = await params;

  /*
   * Authentication + organization + membership
   * are established once here.
   */
  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { session, user, organization, membership } = dashboard.data;

  const canManageTeams =
    membership.role === "owner" || membership.role === "admin";

  /*
   * Only fetch data required by the dashboard shell.
   *
   * Sidebar teams should NOT load team members.
   */
  const [allUserOrganizations, teams] = await Promise.all([
    getUserOrganizations({
      userId: user.id,
    }),

    getSidebarTeams({
      organizationId: organization.id,
      userId: user.id,
      canManageTeams,
    }),
  ]);

  return (
    <>
      <TopLoadingBar />

      <SidebarProvider>
        <AppSidebar
          organization={organization}
          allUserOrganizations={allUserOrganizations}
          organizationSlug={organization.slug}
          user={user}
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
            <Suspense fallback={<DashboardContentSkeleton />}>
              {children}
            </Suspense>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default DashboardLayout;
