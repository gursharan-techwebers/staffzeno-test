"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const EmptyState = ({
  icon,
  title,
  description,
  actionIcon,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const hasAction = Boolean(actionLabel && onAction);

  return (
    <Card className="relative min-h-100 overflow-hidden border">
      {/* Pattern */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)]
          bg-size-[10px_10px]
          [--pattern-fg:color-mix(in_oklab,var(--color-muted-foreground)_5%,transparent)]
          dark:[--pattern-fg:color-mix(in_oklab,var(--color-white)_4%,transparent)]
        "
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-100 items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>

          <h3 className="text-lg font-semibold">{title}</h3>

          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {hasAction && (
            <Button className="mt-5" onClick={onAction}>
              {actionIcon}
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EmptyState;
