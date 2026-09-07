export function AccountSettingsContentSkeleton() {
  return (
    <div className="w-full max-w-3xl">
      {/* Tabs */}
      <div className="flex h-10 w-fit items-center gap-1 rounded-full bg-muted p-1">
        <div className="h-8 w-24 animate-pulse rounded-full bg-background" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-background/70" />
      </div>

      {/* Profile content */}
      <div className="mt-6 space-y-6">
        {/* Section heading */}
        <div className="space-y-2">
          <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border" />

        {/* User information */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="size-10 animate-pulse rounded-full bg-muted" />

          {/* Name + email */}
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <div className="h-4 w-14 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
