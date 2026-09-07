import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { TableSkeleton } from "@/components/shared/dashboard/TableSkeleton";

export default function Loading() {
  return (
    <>
      <DashboardPageHeader
        title="Invitations"
        description="Manage pending invitations and invite employees to your organization."
      />
      <TableSkeleton columns={6} rows={5} />
    </>
  );
}