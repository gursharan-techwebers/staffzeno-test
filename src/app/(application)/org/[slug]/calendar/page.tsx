import { Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import CalendarContent from "@/components/dashboard/Calendar/CalendarContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationAttendanceSettings } from "@/server/organization/getOrganizationAttendanceSettings";
import { getOrganizationHolidays } from "@/server/organization/getOrganizationHolidays";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Calendar = async ({ params }: Props) => {
  const { slug } = await params;

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization, user, membership } = dashboard.data;

  const [attendanceSettings, holidaysResult] = await Promise.all([
    getOrganizationAttendanceSettings({
      organizationId: organization.id,
    }),
    getOrganizationHolidays({
      organizationId: organization.id,
    }),
  ]);

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
    membership.role === "owner" || membership.role === "admin";

  return (
    <CalendarContent
      holidays={holidaysResult.data}
      canManageHolidays={canManageHolidays}
      attendanceSettings={attendanceSettings}
    />
  );
};

export default Calendar;