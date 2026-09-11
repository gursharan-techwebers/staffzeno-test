import { notFound, redirect } from "next/navigation";

import OrganizationSettingsContent from "@/components/dashboard/Settings/OrganizationSettings/OrganizationSettingsContent";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettings } from "@/server/organization/getOrganizationSettings";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";
import { getOrganizationLeaveSettings } from "@/server/organization/getOrganizationLeaveSettings";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const OrganizationSettings = async ({ params }: Props) => {
  const { slug } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    notFound();
  }

  const { organization } = dashboard.data;

  const [organizationSettings, attendanceSettings, leaveSettings] =
    await Promise.all([
      getOrganizationSettings({
        organizationId: organization.id,
      }),
      getOrganizationAttendanceSettings({
        organizationId: organization.id,
      }),
      getOrganizationLeaveSettings({
        organizationId: organization.id,
      }),
    ]);

  if (!organizationSettings) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl">
      <DashboardPageHeader
        title="Organization Settings"
        description="Manage your organization information, attendance, working hours, and leave policies."
      />

      <OrganizationSettingsContent
        organization={{
          id: organizationSettings.id,
          name: organizationSettings.name,
          email: organizationSettings.email,
          phone: organizationSettings.phone,
          address: organizationSettings.address,
        }}
        attendanceSettings={attendanceSettings}
        leaveSettings={leaveSettings}
      />
    </div>
  );
};

export default OrganizationSettings;
