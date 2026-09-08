import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-9 w-24" />
      </div>

      {/* Generic content blocks */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>

      <Skeleton className="h-75 w-full rounded-lg" />
    </div>
  );
}