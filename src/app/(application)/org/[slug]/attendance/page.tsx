import { Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";
import { getDashboardContext } from "@/server/organization/getDashboardContext";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Attendance = async ({ params }: Props) => {
  const { slug } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization } = dashboard.data;

  const settingsStatus = await getOrganizationSettingsStatus({
    organizationId: organization.id,
  });

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
        actionHref={`/org/${organization.slug}/settings?tab=attendance`}
      />
    );
  }

  return <div>Attendance</div>;
};

export default Attendance;
