export function AttendanceDetailsSkeleton() {
  return (
    <div className="max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />

          {/* Employee information */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Name */}
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />

            {/* Title + date */}
            <div className="h-3 w-52 animate-pulse rounded-md bg-muted" />
          </div>

          {/* Status */}
          <div className="mr-10 h-6 w-16 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
        <div className="space-y-6 px-6 pb-6 pt-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border bg-background p-3">
                {/* Label */}
                <div className="h-3 w-16 animate-pulse rounded-md bg-muted" />

                {/* Value */}
                <div className="mt-2 h-5 w-20 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>

          {/* Timeline */}
          <section className="space-y-4">
            {/* Timeline heading */}
            <div>
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />

              <div className="mt-2 h-3 w-64 animate-pulse rounded-md bg-muted" />
            </div>

            {/* Session */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-muted/20 p-4">
                {/* Session header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="space-y-2">
                    {/* Session number */}
                    <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />

                    {/* Time */}
                    <div className="h-3 w-28 animate-pulse rounded-md bg-muted" />
                  </div>

                  {/* Worked badge */}
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                </div>

                {/* Timeline */}
                <div className="relative ml-2 space-y-5 border-l pl-6">
                  {/* Punched in */}
                  <SkeletonTimelineItem />

                  {/* Break */}
                  <SkeletonTimelineItem />

                  {/* Punched out */}
                  <SkeletonTimelineItem />
                </div>
              </div>
            </div>
          </section>

          {/* Attendance Summary */}
          <section className="space-y-3">
            {/* Heading */}
            <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />

            {/* Rows */}
            <div className="rounded-xl border">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between px-4 py-3 ${
                    index !== 4 ? "border-b" : ""
                  }`}
                >
                  {/* Label */}
                  <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />

                  {/* Value */}
                  <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SkeletonTimelineItem() {
  return (
    <div className="relative">
      {/* Timeline icon */}
      <div className="absolute -left-9.5 top-0 flex size-6 items-center justify-center rounded-full border bg-background">
        <div className="size-3.5 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Timeline content */}
      <div className="space-y-1.5">
        {/* Title + time */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />

          <div className="h-3 w-14 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Description */}
        <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
