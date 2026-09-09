export function OrganizationSettingsContentSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      {/* Tabs */}
      <div className="flex h-10 w-fit items-center gap-1 rounded-xl bg-muted p-1">
        <div className="h-8 w-24 animate-pulse rounded-xl bg-background" />
        <div className="h-8 w-46 animate-pulse rounded-xl bg-background/70" />
        <div className="h-8 w-36 animate-pulse rounded-xl bg-background/70" />
        <div className="h-8 w-24 animate-pulse rounded-xl bg-background/70" />
      </div>

      {/* General settings content */}
      <div className="mt-6 space-y-6">
        {/* Section heading */}
        <div className="space-y-2">
          <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border" />

        {/* Organization information */}
        <div className="flex items-center gap-3">
          {/* Organization logo */}
          <div className="size-10 animate-pulse rounded-full bg-muted" />

          {/* Organization name + email */}
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        {/* Organization name */}
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <div className="h-4 w-14 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}