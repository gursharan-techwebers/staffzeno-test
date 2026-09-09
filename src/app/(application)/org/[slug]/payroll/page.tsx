import { Settings2Icon, WalletCardsIcon } from "lucide-react";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

const Payroll = async () => {
  const settingsStatus = await getOrganizationSettingsStatus();

  if (!settingsStatus) {
    return null;
  }

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
        actionHref={`/org/${settingsStatus.organizationSlug}/settings?tab=${missingSetting}`}
      />
    );
  }

  return <div>Payroll</div>;
};

export default Payroll;
