import { ReactNode } from "react";
import { StatusDot, StatusDotVariant } from "./StatusDot";

export function PopoverStatus({
  dot,
  title,
  description,
}: {
  dot: StatusDotVariant;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold flex items-center gap-3">
          {title}
          <StatusDot variant={dot} />
        </div>

        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function PopoverMetrics({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2.5 border-y py-3">{children}</div>;
}

export function MetricRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span className={`font-medium ${!emphasize && "opacity-60"}`}>
        {value}
      </span>
    </div>
  );
}
