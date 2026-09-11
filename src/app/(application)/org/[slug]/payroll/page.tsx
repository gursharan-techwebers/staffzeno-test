import { Settings2Icon, WalletCardsIcon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Payroll = async ({ params }: Props) => {
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
  // Attendance / leave settings are required
  // --------------------------------------------------
  if (!settingsStatus.attendance || !settingsStatus.leave) {
    const missingSetting = !settingsStatus.attendance ? "attendance" : "leave";

    return (
      <EmptyState
        icon={<WalletCardsIcon className="size-6 text-muted-foreground" />}
        title="Payroll setup required"
        description="Before you can manage payroll, you need to configure your organization's attendance and leave settings."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel={
          missingSetting === "attendance"
            ? "Configure attendance settings"
            : "Configure leave settings"
        }
        actionHref={`/org/${organization.slug}/settings?tab=${missingSetting}`}
      />
    );
  }

  return <div>Payroll</div>;
};

export default Payroll;
