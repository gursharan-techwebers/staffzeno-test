import { DashboardPageHeaderSkeleton } from "@/components/dashboard/dashboardPageHeaderSkeleton";
import { TableSkeleton } from "@/components/shared/dashboard/TableSkeleton";

export default function Loading() {
  return (
    <>
      <DashboardPageHeaderSkeleton />
      <TableSkeleton columns={5} rows={5} />
    </>
  );
}