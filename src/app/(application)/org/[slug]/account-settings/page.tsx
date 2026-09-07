import { notFound } from "next/navigation";

import AccountSettingsContent from "@/components/dashboard/Settings/AccountSettings/AccountSettingsContent";

import { getCurrentUser } from "@/server/user/getCurrentUser";
import { getUserSessions } from "@/server/user/getUserSessions";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const AccountSettings = async ({ params: _params }: Props) => {
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const sessions = await getUserSessions();

  return (
    <>
      <DashboardPageHeader
        title="Account Settings"
        description="Manage your personal information and account security."
      />

      <AccountSettingsContent
        user={user}
        lastPasswordChangedAt={user.lastPasswordChangedAt}
        sessions={sessions}
      />
    </>
  );
};

export default AccountSettings;
