import { redirect } from "next/navigation";

import AccountSettingsContent from "@/components/dashboard/Settings/AccountSettings/AccountSettingsContent";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";

import { getAuthContext } from "@/server/auth/getAuthContext";
import { getAccountSettingsUser } from "@/server/user/getAccountSettingsUser";
import { getUserSessions } from "@/server/user/getUserSessions";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const AccountSettings = async ({ params: _params }: Props) => {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/login");
  }

  const { user } = authContext;

  const [accountUser, sessions] = await Promise.all([
    getAccountSettingsUser(user.id),
    getUserSessions(),
  ]);

  if (!accountUser) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-2xl">
      <DashboardPageHeader
        title="Account Settings"
        description="Manage your personal information and account security."
      />

      <AccountSettingsContent
        user={accountUser}
        lastPasswordChangedAt={accountUser.lastPasswordChangedAt}
        sessions={sessions}
      />
    </div>
  );
};

export default AccountSettings;
