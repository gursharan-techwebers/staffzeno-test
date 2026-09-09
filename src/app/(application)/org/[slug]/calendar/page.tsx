import { Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";
import { getActiveOrganization } from "@/server/organization/getActiveOrganization";
import { getUserOrganizationRole } from "@/server/organization/getUserOrganizationRole";
import { getOrganizationHolidays } from "@/server/organization/getOrganizationHolidays";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";

import CalendarContent from "@/components/dashboard/Calendar/CalendarContent";

const Calendar = async () => {
  const settingsStatus = await getOrganizationSettingsStatus();

  if (!settingsStatus) {
    return null;
  }

  /*
   * Attendance settings are required
   * before showing the calendar.
   */
  if (!settingsStatus.attendance) {
    return (
      <EmptyState
        icon={<Clock3Icon className="size-6 text-muted-foreground" />}
        title="Attendance settings required"
        description="Before you can use the calendar, you need to configure your organization's working hours, working days, and attendance rules."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure attendance settings"
        actionHref={`/org/${settingsStatus.organizationSlug}/settings?tab=attendance`}
      />
    );
  }

  const [organization, roleResult, holidaysResult, attendanceSettings] =
    await Promise.all([
      getActiveOrganization(),
      getUserOrganizationRole(),
      getOrganizationHolidays(),
      getOrganizationAttendanceSettings(),
    ]);

  if (!organization || !holidaysResult.success) {
    redirect(`/org/${organization?.slug ?? ""}`);
  }

  if (!roleResult.success) {
    return null;
  }

  const canManageHolidays =
    roleResult.data === "owner" || roleResult.data === "admin";

  if (!attendanceSettings) {
    return null;
  }

  return (
    <CalendarContent
      holidays={holidaysResult.data}
      canManageHolidays={canManageHolidays}
      attendanceSettings={attendanceSettings}
    />
  );
};

export default Calendar;
