import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function TableSkeleton({
  columns = 5,
  rows = 5,
}: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            {Array.from({ length: columns }).map((_, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left"
              >
                <Skeleton
                  className={`h-4 ${
                    index === 0 ? "w-24" : "w-16"
                  }`}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b last:border-b-0"
            >
              {Array.from({
                length: columns,
              }).map((_, columnIndex) => (
                <td
                  key={columnIndex}
                  className="px-4 py-4"
                >
                  <Skeleton
                    className={`h-4 ${
                      columnIndex === 0
                        ? "w-40"
                        : "w-24"
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}