import { LockKeyholeIcon, UserIcon } from "lucide-react";

import ProfileSettings from "./ProfileSettings";
import SecuritySettings from "./SecuritySettings";

import SettingsSection from "@/components/shared/dashboard/SettingsSection";
import SettingsSidebar, {
  type SettingsSidebarItem,
} from "@/components/shared/dashboard/SettingsSidebar";

import type { SecuritySession } from "@/types/auth/session";

type AccountSettingsContentProps = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image?: string | null;
    hasPassword: boolean;
  };

  lastPasswordChangedAt: Date | null;

  sessions: SecuritySession[];
};

const accountSettingsSections = [
  {
    id: "profile",
    label: "Profile",
    icon: "user",
  },
  {
    id: "security",
    label: "Security",
    icon: "lock",
  },
] satisfies SettingsSidebarItem[];

const AccountSettingsContent = ({
  user,
  lastPasswordChangedAt,
  sessions,
}: AccountSettingsContentProps) => {
  return (
    <div className="relative flex w-full min-w-0 items-start gap-8">
      {/* Sidebar */}

      <SettingsSidebar title="Account" items={accountSettingsSections} />

      {/* Settings Content */}

      <main className="min-w-0 flex-1">
        <div className="space-y-10">
          <SettingsSection sectionId="profile">
            <ProfileSettings user={user} />
          </SettingsSection>

          <SettingsSection sectionId="security">
            <SecuritySettings
              lastPasswordChangedAt={lastPasswordChangedAt}
              sessions={sessions}
              hasPassword={user.hasPassword}
            />
          </SettingsSection>
        </div>
      </main>
    </div>
  );
};

export default AccountSettingsContent;
