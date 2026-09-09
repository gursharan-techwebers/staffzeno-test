import { ReactNode } from "react";
import { Button } from "../ui/button";

type DashboardPageHeaderProps = {
  title: string;
  description: string;
  actionIcon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function DashboardPageHeader({
  title,
  description,
  actionIcon,
  actionLabel,
  onAction,
  className = "",
}: DashboardPageHeaderProps) {
  return (
    <div
      className={`flex gap-2 flex-wrap items-center justify-between ${className}`}
    >
      <div className="flex flex-col gap-1 mb-2 md:mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {actionLabel && (
        <Button onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
