import GeneralSettings from "./GeneralSettings";
import AttendanceSettings from "./AttendanceSettings";
import LeaveManagementSettings from "./LeaveManagementSettings";
import DangerSettings from "./DangerSettings";

import type {
  WorkingDay,
  WorkingSaturday,
} from "@/validators/organization/settings/attendance";
import SettingsSection from "@/components/shared/dashboard/SettingsSection";
import SettingsSidebar, {
  SettingsSidebarItem,
} from "@/components/shared/dashboard/SettingsSidebar";

type OrganizationSettingsContentProps = {
  organization: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };

  attendanceSettings: {
    officeStartTime: string;
    officeEndTime: string;
    gracePeriod: number;
    workingDays: WorkingDay[];
    workingSaturdays: WorkingSaturday[];
  } | null;

  leaveSettings: {
    monthlyPaidLeaves: number;
    monthlyPaidHalfDayLeaves: number;
    monthlyPaidShortLeaves: number;
    shortLeaveDuration: number;
    carryForwardEnabled: boolean;
    leaveEncashmentEnabled: boolean;
  } | null;
};

const organizationSettingsSections = [
  {
    id: "general",
    label: "General",
    icon: "building",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: "calendar",
  },
  {
    id: "leave",
    label: "Leave",
    icon: "clipboard",
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: "warning",
    danger: true,
  },
] satisfies SettingsSidebarItem[];

const OrganizationSettingsContent = ({
  organization,
  attendanceSettings,
  leaveSettings,
}: OrganizationSettingsContentProps) => {
  return (
    <div className="flex w-full min-w-0 items-start gap-8 relative">
      {/* Sidebar */}

      <SettingsSidebar
        title="Organization"
        items={organizationSettingsSections}
      />

      {/* Settings Content */}

      <main className="min-w-0 flex-1">
        <div className="space-y-10">
          <SettingsSection sectionId="general">
            <GeneralSettings organization={organization} />
          </SettingsSection>

          <SettingsSection sectionId="attendance">
            <AttendanceSettings settings={attendanceSettings} />
          </SettingsSection>

          <SettingsSection sectionId="leave">
            <LeaveManagementSettings settings={leaveSettings} />
          </SettingsSection>

          <SettingsSection sectionId="danger">
            <DangerSettings
              organization={{
                id: organization.id,
                name: organization.name,
              }}
            />
          </SettingsSection>
        </div>
      </main>
    </div>
  );
};

export default OrganizationSettingsContent;
