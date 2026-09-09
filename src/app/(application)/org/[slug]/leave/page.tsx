import { CalendarDaysIcon, Settings2Icon } from "lucide-react";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

const Leave = async () => {
  const settingsStatus = await getOrganizationSettingsStatus();

  if (!settingsStatus) {
    return null;
  }

  if (!settingsStatus.leave) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
        title="Leave settings required"
        description="Before you can manage leave, you need to configure your organization's leave policies and leave management settings."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure leave settings"
        actionHref={`/org/${settingsStatus.organizationSlug}/settings?tab=leave`}
      />
    );
  }

  return <div>Leave</div>;
};

export default Leave;