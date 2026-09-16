import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/dashboardPageHeaderSkeleton";
import { TableSkeleton } from "@/components/shared/dashboard/TableSkeleton";

export default function Loading() {
  return (
    <>
      <DashboardPageHeaderSkeleton/>
      <TableSkeleton columns={7} rows={5} />
    </>
  );
}