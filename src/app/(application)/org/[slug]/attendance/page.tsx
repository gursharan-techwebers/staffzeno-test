import { Clock3Icon, Settings2Icon } from "lucide-react";
import { redirect } from "next/navigation";

import AttendanceContent from "@/components/dashboard/Attendance/AttendanceContent";
import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

import type { ManageAttendance } from "@/types/organization/attendance";
import type { Attendance } from "@/types/organization/attendance";
import { getMemberAttendance } from "@/server/attendance/getMemberAttendance";
import { getOrganizationAttendance } from "@/server/attendance/getOrganizationAttendance";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Attendance = async ({ params }: Props) => {
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

  const { organization, membership, user } = dashboard.data;

  /**
   * ---------------------------------------------------------
   * 2. Resolve permissions
   * ---------------------------------------------------------
   */

  const isOrganizationOwner = organization.createdById === user.id;
  const isOrganizationAdmin = membership.role === "admin";

  const canManageAttendance = isOrganizationOwner || isOrganizationAdmin;

  const canConfigureAttendance = isOrganizationOwner || isOrganizationAdmin;

  const canAdjustAttendance = isOrganizationOwner || isOrganizationAdmin;

  /**
   * ---------------------------------------------------------
   * 3. Check attendance settings
   * ---------------------------------------------------------
   */

  const settingsStatus = await getOrganizationSettingsStatus({
    organizationId: organization.id,
  });

  if (!settingsStatus) {
    return null;
  }

  if (!settingsStatus.attendance) {
    if (!canManageAttendance) {
      return (
        <EmptyState
          icon={<Clock3Icon className="size-6 text-muted-foreground" />}
          title="Attendance unavailable"
          description="Attendance has not been configured for this organization yet. Please contact your organization administrator."
        />
      );
    }

    return (
      <EmptyState
        icon={<Clock3Icon className="size-6 text-muted-foreground" />}
        title="Attendance settings required"
        description="Before you can manage attendance, you need to configure your organization's working hours, working days, and attendance rules."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure attendance settings"
        actionHref={`/org/${organization.slug}/settings#attendance`}
      />
    );
  }

  /**
   * ---------------------------------------------------------
   * 4. Resolve actual attendance
   * ---------------------------------------------------------
   */

  const myAttendance = await getMemberAttendance({
    organizationId: organization.id,
    memberId: membership.id,
  });

  const manageableAttendance = canManageAttendance
    ? await getOrganizationAttendance({
        organizationId: organization.id,
      })
    : [];

  /**
   * ---------------------------------------------------------
   * 5. Render
   * ---------------------------------------------------------
   */

  return (
    <AttendanceContent
      myAttendance={myAttendance}
      manageableAttendance={manageableAttendance}
      canManageAttendance={canManageAttendance}
      canConfigureAttendance={canConfigureAttendance}
      canAdjustAttendance={canAdjustAttendance}
    />
  );
};

export default Attendance;
