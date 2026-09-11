import { Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getActiveOrganization } from "@/server/organization/getActiveOrganization";
import { getUserOrganizationRole } from "@/server/organization/getUserOrganizationRole";
import { getOrganizationHolidays } from "@/server/organization/getOrganizationHolidays";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";

import CalendarContent from "@/components/dashboard/Calendar/CalendarContent";

const Calendar = async () => {
  const organization = await getActiveOrganization();

  if (!organization) {
    return null;
  }

  const [attendanceSettings, roleResult, holidaysResult] = await Promise.all([
    getOrganizationAttendanceSettings(),
    getUserOrganizationRole(),
    getOrganizationHolidays(),
  ]);

  if (!roleResult.success) {
    return null;
  }

  if (!attendanceSettings) {
    return (
      <EmptyState
        icon={<Clock3Icon className="size-6 text-muted-foreground" />}
        title="Attendance settings required"
        description="Before you can use the calendar, you need to configure your organization's working hours, working days, and attendance rules."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure attendance settings"
        actionHref={`/org/${organization.slug}/settings?tab=attendance`}
      />
    );
  }

  if (!holidaysResult.success) {
    redirect(`/org/${organization.slug}`);
  }

  const canManageHolidays =
    roleResult.data === "owner" || roleResult.data === "admin";

  return (
    <CalendarContent
      holidays={holidaysResult.data}
      canManageHolidays={canManageHolidays}
      attendanceSettings={attendanceSettings}
    />
  );
};

export default Calendar;
