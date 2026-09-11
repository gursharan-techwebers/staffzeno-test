import { notFound } from "next/navigation";

import OrganizationSettingsContent from "@/components/dashboard/Settings/OrganizationSettings/OrganizationSettingsContent";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { getActiveOrganization } from "@/server/organization/getActiveOrganization";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";
import { getOrganizationLeaveSettings } from "@/server/organization/getOrganizationLeaveSettings";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const OrganizationSettings = async ({ params: _params }: Props) => {
  const organization = await getActiveOrganization();

  if (!organization) {
    notFound();
  }

  const [attendanceSettings, leaveSettings] = await Promise.all([
    getOrganizationAttendanceSettings(),
    getOrganizationLeaveSettings(),
  ]);

  return (
    <div className="w-full max-w-2xl">
      <DashboardPageHeader
        title="Organization Settings"
        description="Manage your organization information, attendance, working hours, and leave policies."
      />

      <OrganizationSettingsContent
        organization={{
          id: organization.id,
          name: organization.name,
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
        }}
        attendanceSettings={attendanceSettings}
        leaveSettings={leaveSettings}
      />
    </div>
  );
};

export default OrganizationSettings;
