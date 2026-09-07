import { notFound } from "next/navigation";

import AccountSettingsContent from "@/components/dashboard/Settings/AccountSettings/AccountSettingsContent";

import { getCurrentUser } from "@/server/user/getCurrentUser";
import { getUserSessions } from "@/server/user/getUserSessions";

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
    <AccountSettingsContent
      user={user}
      lastPasswordChangedAt={user.lastPasswordChangedAt}
      sessions={sessions}
    />
  );
};

export default AccountSettings;
