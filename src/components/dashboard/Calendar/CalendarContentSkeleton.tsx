export function CalendarContentSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Calendar */}
      <div className="min-h-0 overflow-hidden rounded-xl border">
        <div className="p-3">
          {/* Calendar header */}
          <div className="flex h-8 items-center justify-between">
            {/* Previous month */}
            <div className="size-8 animate-pulse rounded-md bg-muted" />

            {/* Month */}
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />

            {/* Next month */}
            <div className="size-8 animate-pulse rounded-md bg-muted" />
          </div>

          {/* Weekdays */}
          <div className="mt-4 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="flex h-8 items-center justify-center"
              >
                <div className="h-3 w-7 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="mt-2 space-y-2">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-7 gap-1"
              >
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="aspect-square w-full animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organization holidays */}
      <div className="min-h-0 overflow-hidden rounded-xl border">
        {/* Header */}
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Calendar icon */}
            <div className="size-4 animate-pulse rounded-md bg-muted" />

            {/* Title */}
            <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />

            {/* Count */}
            <div className="h-3 w-5 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        {/* Holiday list */}
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-5 py-4"
            >
              {/* Date */}
              <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                <div className="h-2.5 w-6 animate-pulse rounded-sm bg-background/70" />
                <div className="mt-1.5 h-4 w-5 animate-pulse rounded-sm bg-background/70" />
              </div>

              {/* Holiday information */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-3 w-52 animate-pulse rounded-md bg-muted" />
              </div>

              {/* Actions */}
              <div className="size-8 shrink-0 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}