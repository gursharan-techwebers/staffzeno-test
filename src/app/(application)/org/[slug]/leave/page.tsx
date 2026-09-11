import { CalendarDaysIcon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Leave = async ({ params }: Props) => {
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

  const { organization } = dashboard.data;

  // --------------------------------------------------
  // Check organization configuration
  // --------------------------------------------------
  const settingsStatus = await getOrganizationSettingsStatus({
    organizationId: organization.id,
  });

  if (!settingsStatus) {
    return null;
  }

  // --------------------------------------------------
  // Leave settings are required
  // --------------------------------------------------
  if (!settingsStatus.leave) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
        title="Leave settings required"
        description="Before you can manage leave, you need to configure your organization's leave policies and leave management settings."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure leave settings"
        actionHref={`/org/${organization.slug}/settings?tab=leave`}
      />
    );
  }

  return <div>Leave</div>;
};

export default Leave;
