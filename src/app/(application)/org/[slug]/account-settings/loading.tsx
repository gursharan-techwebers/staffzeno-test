import { DashboardPageHeaderSkeleton } from "@/components/dashboard/dashboardPageHeaderSkeleton";
import { AccountSettingsContentSkeleton } from "@/components/dashboard/Settings/AccountSettings/AccountSettingsContentSkeleton";

const Loading = () => {
  return (
    <>
      <DashboardPageHeaderSkeleton />

      <AccountSettingsContentSkeleton />
    </>
  );
};

export default Loading;
