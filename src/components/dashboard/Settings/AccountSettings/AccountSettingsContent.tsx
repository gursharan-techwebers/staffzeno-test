"use client";

import { useState } from "react";
import { LockKeyholeIcon, UserIcon } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProfileSettings from "./ProfileSettings";
import SecuritySettings from "./SecuritySettings";
import { SecuritySession } from "@/types/auth/session";

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

const AccountSettingsContent = ({
  user,
  lastPasswordChangedAt,
  sessions,
}: AccountSettingsContentProps) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <UserIcon className="size-4" />
            Profile
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LockKeyholeIcon className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings user={user} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings
            lastPasswordChangedAt={lastPasswordChangedAt}
            sessions={sessions}
             hasPassword={user.hasPassword}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AccountSettingsContent;
