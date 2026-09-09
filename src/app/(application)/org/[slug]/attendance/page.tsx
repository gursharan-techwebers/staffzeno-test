import { Clock3Icon, Settings2Icon } from "lucide-react";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

const Attendance = async () => {
  const settingsStatus = await getOrganizationSettingsStatus();

  if (!settingsStatus) {
    return null;
  }

  if (!settingsStatus.attendance) {
    return (
      <EmptyState
        icon={<Clock3Icon className="size-6 text-muted-foreground" />}
        title="Attendance settings required"
        description="Before you can manage attendance, you need to configure your organization's working hours, working days, and attendance rules."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure attendance settings"
        actionHref={`/org/${settingsStatus.organizationSlug}/settings?tab=attendance`}
      />
    );
  }

  return <div>Attendance</div>;
};

export default Attendance;