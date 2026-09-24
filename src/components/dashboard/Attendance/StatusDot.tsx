export type StatusDotVariant =
  "working" | "break" | "neutral" | "warning" | "finalized";

export function StatusDot({ variant }: { variant: StatusDotVariant }) {
  const className = {
    working: "bg-emerald-500",
    break: "bg-amber-500",
    neutral: "bg-muted-foreground",
    warning: "bg-orange-500",
    finalized: "bg-primary",
  }[variant];

  const ringClassName = {
    working: "bg-emerald-500/50",
    break: "bg-amber-500/50",
    neutral: "bg-muted-foreground/20",
    warning: "bg-orange-500/50",
    finalized: "bg-primary/50",
  }[variant];

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-1.5 w-1.5 shrink-0 items-center justify-center"
    >
      {/* Ping ring */}
      <span
        className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
          variant === "working" ? "animate-ping" : ""
        } ${ringClassName}`}
      />

      {/* Solid dot */}
      <span className={`relative h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
  );
}

/**
 * Format seconds as HH:MM.
 *
 * Seconds are intentionally hidden from the UI.
 * The colon uses Tailwind's pulse animation so
 * the timer still feels live without rendering seconds.
 */
export function Duration({
  seconds,
  className = "",
}: {
  seconds: number;
  className?: string;
}) {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <span className={`tabular-nums ${className}`}>
      {String(hours).padStart(2, "0")}
      <span className="">:</span>
      {String(minutes).padStart(2, "0")}
    </span>
  );
}

export function SessionAvailability({
  remainingSeconds,
  totalSeconds,
}: {
  remainingSeconds: number;
  totalSeconds: number;
}) {
  const progress =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100))
      : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <div className="h-0.5 w-full overflow-hidden bg-muted/40">
        <div
          className="h-full bg-primary"
          style={{
            width: `${progress}%`,
            transition: "width 1s linear",
          }}
        />
      </div>
    </div>
  );
}
