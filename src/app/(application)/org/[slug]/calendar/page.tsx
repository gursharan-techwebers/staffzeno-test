import { CalendarDaysIcon, Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import CalendarContent from "@/components/dashboard/Calendar/CalendarContent";
import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";
import { getOrganizationHolidays } from "@/server/organization/getOrganizationHolidays";
import { getDashboardContext } from "@/server/organization/getDashboardContext";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Calendar = async ({ params }: Props) => {
  const { slug } = await params;

  /**
   * ---------------------------------------------------------
   * 1. Dashboard / authentication context
   * ---------------------------------------------------------
   */

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization, user } = dashboard.data;

  /**
   * ---------------------------------------------------------
   * 2. Resolve organization permissions
   * ---------------------------------------------------------
   *
   * Everyone can view the organization calendar.
   *
   * Owner/Admin:
   *   → Can manage holidays
   *
   * Regular member:
   *   → Can view the calendar
   *   → Cannot manage holidays
   */

  const isOrganizationOwner = organization.createdById === user.id;

  const isOrganizationAdmin = dashboard.data.membership.role === "admin";

  const canManageHolidays = isOrganizationOwner || isOrganizationAdmin;

  /**
   * ---------------------------------------------------------
   * 3. Load calendar requirements/data
   * ---------------------------------------------------------
   */

  const [attendanceSettings, holidaysResult] = await Promise.all([
    getOrganizationAttendanceSettings({
      organizationId: organization.id,
    }),
    getOrganizationHolidays({
      organizationId: organization.id,
    }),
  ]);

  /**
   * ---------------------------------------------------------
   * 4. Attendance settings are required
   * ---------------------------------------------------------
   *
   * If attendance/calendar settings are not configured:
   *
   * Owner/Admin:
   *   → Show settings-required state
   *   → Allow them to configure settings
   *
   * Regular member:
   *   → Show calendar unavailable state
   *   → Do not show configuration action
   */

  if (!attendanceSettings) {
    if (!canManageHolidays) {
      return (
        <EmptyState
          icon={<CalendarDaysIcon className="size-6 text-muted-foreground" />}
          title="Calendar unavailable"
          description="The organization calendar has not been configured yet. Please contact your organization administrator."
        />
      );
    }

    return (
      <EmptyState
        icon={<Clock3Icon className="size-6 text-muted-foreground" />}
        title="Attendance settings required"
        description="Before you can use the calendar, you need to configure your organization's working hours, working days, and attendance rules."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure attendance settings"
        actionHref={`/org/${organization.slug}/settings#attendance`}
      />
    );
  }

  /**
   * ---------------------------------------------------------
   * 5. Validate holiday data
   * ---------------------------------------------------------
   */

  if (!holidaysResult.success) {
    redirect(`/org/${organization.slug}`);
  }

  /**
   * ---------------------------------------------------------
   * 6. Render calendar
   * ---------------------------------------------------------
   *
   * Everyone can reach this point when attendance settings
   * are configured.
   */

  return (
    <CalendarContent
      holidays={holidaysResult.data}
      canManageHolidays={canManageHolidays}
      attendanceSettings={attendanceSettings}
    />
  );
};

export default Calendar;
