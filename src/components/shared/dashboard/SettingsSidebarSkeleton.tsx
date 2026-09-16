type SettingsSidebarSkeletonProps = {
  itemCount?: number;
};

const SettingsSidebarSkeleton = ({
  itemCount = 2,
}: SettingsSidebarSkeletonProps) => {
  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div className="w-full">
        {/* Sidebar title */}
        <div className="mb-3 px-3">
          <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Sidebar items */}
        <nav className="space-y-1">
          {Array.from({ length: itemCount }).map((_, index) => (
            <div
              key={index}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3"
            >
              <div className="size-4 animate-pulse rounded-md bg-muted" />

              <div
                className={[
                  "h-4 animate-pulse rounded-md bg-muted",
                  index === 0 ? "w-16" : "w-20",
                ].join(" ")}
              />
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default SettingsSidebarSkeleton;
