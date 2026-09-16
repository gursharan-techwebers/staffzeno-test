import { notFound, redirect } from "next/navigation";

import OrganizationSettingsContent from "@/components/dashboard/Settings/OrganizationSettings/OrganizationSettingsContent";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettings } from "@/server/organization/getOrganizationSettings";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";
import { getOrganizationLeaveSettings } from "@/server/organization/getOrganizationLeaveSettings";
import HashScroll from "@/components/shared/dashboard/HashScroll";

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
    <>
      <DashboardPageHeader
        title="Organization Settings"
        description="Manage your organization information, attendance, working hours, and leave policies."
      />

      <HashScroll />

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
    </>
  );
};

export default OrganizationSettings;
