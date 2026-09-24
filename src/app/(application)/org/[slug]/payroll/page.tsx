import { Settings2Icon, WalletCardsIcon } from "lucide-react";
import { redirect } from "next/navigation";

import EmptyState from "@/components/shared/dashboard/EmptyState";

import { getDashboardContext } from "@/server/organization/getDashboardContext";
import { getOrganizationSettingsStatus } from "@/server/organization/getOrganizationSettingsStatus";
import PayrollContext from "@/components/dashboard/Payroll/PayrollContent";
import PayrollContent from "@/components/dashboard/Payroll/PayrollContent";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Payroll = async ({ params }: Props) => {
  const { slug } = await params;

  // --------------------------------------------------
  // 1. Resolve authentication + organization + membership
  // --------------------------------------------------

  const dashboard = await getDashboardContext(slug);

  if (!dashboard.success) {
    if (dashboard.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/");
  }

  const { organization, membership, user } = dashboard.data;

  // --------------------------------------------------
  // 2. Resolve organization permissions
  // --------------------------------------------------
  //
  // Everyone can view Payroll.
  //
  // Owner:
  //   → Can view payroll
  //   → Can manage payroll
  //
  // Admin:
  //   → Can view payroll
  //   → Can manage payroll
  //
  // Regular member:
  //   → Can view their own payroll
  //   → Cannot manage organization payroll
  // --------------------------------------------------

  const isOrganizationOwner = organization.createdById === user.id;

  const isOrganizationAdmin = membership.role === "admin";

  const canManagePayroll = isOrganizationOwner || isOrganizationAdmin;

  // --------------------------------------------------
  // 3. Check organization configuration
  // --------------------------------------------------

  const settingsStatus = await getOrganizationSettingsStatus({
    organizationId: organization.id,
  });

  if (!settingsStatus) {
    return null;
  }

  // --------------------------------------------------
  // 4. Attendance + Leave settings are required
  // --------------------------------------------------
  //
  // Owner/Admin:
  //   → Show setup message
  //   → Allow configuration
  //
  // Regular member:
  //   → Payroll is unavailable
  //   → No configuration action
  // --------------------------------------------------

  if (!settingsStatus.attendance || !settingsStatus.leave) {
    const missingSetting = !settingsStatus.attendance ? "attendance" : "leave";

    if (!canManagePayroll) {
      return (
        <EmptyState
          icon={<WalletCardsIcon className="size-6 text-muted-foreground" />}
          title="Payroll unavailable"
          description="Payroll has not been configured for this organization yet. Please contact your organization administrator."
        />
      );
    }

    return (
      <EmptyState
        icon={<WalletCardsIcon className="size-6 text-muted-foreground" />}
        title="Payroll setup required"
        description="Before you can manage payroll, you need to configure your organization's attendance and leave settings."
        actionIcon={<Settings2Icon className="size-4" />}
        actionLabel={
          missingSetting === "attendance"
            ? "Configure attendance settings"
            : "Configure leave settings"
        }
        actionHref={`/org/${organization.slug}/settings#${missingSetting}`}
      />
    );
  }

  // --------------------------------------------------
  // 5. Render Payroll
  // --------------------------------------------------
  //
  // Payroll UI will later receive:
  //
  // canManagePayroll
  // current user's payroll data
  // organization payroll data for Owner/Admin
  //
  // For now, this is only the architectural placeholder.
  // --------------------------------------------------

  return (
    <PayrollContent
      canManagePayroll={canManagePayroll}
      slug={organization.slug}
    />
  );
};

export default Payroll;
