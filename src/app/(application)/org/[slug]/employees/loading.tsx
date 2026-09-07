import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { TableSkeleton } from "@/components/shared/dashboard/TableSkeleton";

export default function Loading() {
  return (
    <>
      <DashboardPageHeader
        title="Employees"
        description="Manage employees in your organization and keep your team organized."
      />
      <TableSkeleton columns={5} rows={5} />
    </>
  );
}