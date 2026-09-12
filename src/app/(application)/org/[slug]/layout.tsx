import { AppSidebar } from "@/components/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboardBreadcrumb";
import DashboardContentSkeleton from "@/components/dashboard/DashboardContentSkeleton";
import TopLoadingBar from "@/components/TopLoadingBar";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";
import { getSidebarTeams } from "@/server/team/getSidebarTeams";

import { redirect } from "next/navigation";
import { Suspense } from "react";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

const DashboardLayout = async ({ children, params }: Props) => {
  const layoutStart = Date.now();

  const { slug } = await params;

  // --------------------------------------------------
  // Resolve authentication + organization + membership
  // --------------------------------------------------
  const dashboard = await getDashboardContext(slug);

  console.log(
    "[STAFFZENO] DashboardLayout - getDashboardContext:",
    Date.now() - layoutStart,
    "ms",
  );

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { user, organization, membership } = dashboard.data;

  const canManageTeams =
    membership.role === "owner" || membership.role === "admin";

  // --------------------------------------------------
  // Load dashboard shell data in parallel
  // --------------------------------------------------
  const shellStart = Date.now();

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

  console.log(
    "[STAFFZENO] DashboardLayout - shell data:",
    Date.now() - shellStart,
    "ms",
  );

  console.log(
    "[STAFFZENO] DashboardLayout - TOTAL before render:",
    Date.now() - layoutStart,
    "ms",
  );

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
