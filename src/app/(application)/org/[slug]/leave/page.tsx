import { CalendarDaysIcon, Settings2Icon } from "lucide-react";

import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";
import LeaveContent from "@/components/dashboard/Leave/LeaveContent";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";

import { getMemberLeaves } from "@/server/leave/getMemberLeaves";
import { getOwnerLeavesToManage } from "@/server/leave/getOwnerLeavesToManage";
import { getOrganizationAdminLeavesToManage } from "@/server/leave/getOrganizationAdminLeavesToManage";

import type { ManageLeave } from "@/types/organization/leave";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Leave = async ({ params }: Props) => {
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
   * 2. Resolve organization permissions
   * ---------------------------------------------------------
   *
   * Owner is identified by organization.createdById.
   *
   * Organization admin is identified by membership.role.
   */

  const isOrganizationOwner = organization.createdById === user.id;

  const isOrganizationAdmin = membership.role === "admin";

  /**
   * Owner and organization admin can manage
   * organization leave settings.
   */

  const canManageLeaveSettings =
    isOrganizationOwner || isOrganizationAdmin;

  /**
   * Users can apply for their own leave.
   *
   * The organization owner can apply only when they
   * are also an organization admin.
   */

  const canApplyForLeave =
    !isOrganizationOwner || isOrganizationAdmin;

  /**
   * ---------------------------------------------------------
   * 3. Overall leave-management permission
   * ---------------------------------------------------------
   *
   * Only organization owner/admin can manage leave requests.
   */

  const canManageLeave = canManageLeaveSettings;

  /**
   * ---------------------------------------------------------
   * 4. Check whether leave settings are configured
   * ---------------------------------------------------------
   */

  const settingsStatus = await getOrganizationSettingsStatus({
    organizationId: organization.id,
  });

  if (!settingsStatus) {
    return null;
  }

  /**
   * ---------------------------------------------------------
   * 5. Leave settings are required before leave management
   * ---------------------------------------------------------
   */

  if (!settingsStatus.leave) {
    if (!canManageLeaveSettings) {
      return (
        <EmptyState
          icon={
            <CalendarDaysIcon className="size-6 text-muted-foreground" />
          }
          title="Leaves unavailable"
          description="Leaves has not been configured for this organization yet. Please contact your organization administrator."
        />
      );
    }

    return (
      <EmptyState
        icon={
          <CalendarDaysIcon className="size-6 text-muted-foreground" />
        }
        title="Leave settings required"
        description="Before you can manage leave, you need to configure your organization's leave policies and leave management settings."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel="Configure leave settings"
        actionHref={`/org/${organization.slug}/settings#leave`}
      />
    );
  }

  /**
   * ---------------------------------------------------------
   * 6. Load current user's own leaves
   * ---------------------------------------------------------
   */

  const leavesResult = await getMemberLeaves({
    organizationId: organization.id,
    memberId: membership.id,
  });

  if (!leavesResult.success) {
    redirect(`/org/${organization.slug}`);
  }

  /**
   * ---------------------------------------------------------
   * 7. Load manageable leaves
   * ---------------------------------------------------------
   *
   * Organization owner:
   *   → Manages leave requests submitted by organization admins
   *
   * Organization admin:
   *   → Manages leave requests submitted by normal members
   *
   * Regular member:
   *   → No manageable leaves
   *
   * There is no team-based leave management.
   */

  let manageableLeaves: ManageLeave[] = [];

  if (isOrganizationOwner) {
    const result = await getOwnerLeavesToManage();

    manageableLeaves = result;
  } else if (isOrganizationAdmin) {
    const result = await getOrganizationAdminLeavesToManage();

    manageableLeaves = result;
  }

  /**
   * ---------------------------------------------------------
   * 8. Render
   * ---------------------------------------------------------
   */

  return (
    <LeaveContent
      myLeaves={leavesResult.data}
      manageableLeaves={manageableLeaves}
      canManageLeave={canManageLeave}
      canApplyForLeave={canApplyForLeave}
    />
  );
};

export default Leave;