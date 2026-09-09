import { CalendarContentSkeleton } from "@/components/dashboard/Calendar/CalendarContentSkeleton";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/dashboardPageHeaderSkeleton";

const Loading = () => {
  return (
    <>
      <DashboardPageHeaderSkeleton />

      <CalendarContentSkeleton />
    </>
  );
};

export default Loading;
