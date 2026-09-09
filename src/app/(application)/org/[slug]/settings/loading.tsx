import { DashboardPageHeaderSkeleton } from "@/components/dashboard/dashboardPageHeaderSkeleton";
import { OrganizationSettingsContentSkeleton } from "@/components/dashboard/Settings/OrganizationSettings/OrganizationSettingsContentSkeleton";

const Loading = () => {
  return (
    <>
      <DashboardPageHeaderSkeleton />

      <OrganizationSettingsContentSkeleton />
    </>
  );
};

export default Loading;
