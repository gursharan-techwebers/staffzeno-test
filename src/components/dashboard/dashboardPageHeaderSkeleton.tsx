export function DashboardPageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2 pb-4">
        {/* Title */}
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />

        {/* Description */}
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Action button */}
      <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
    </div>
  );
}