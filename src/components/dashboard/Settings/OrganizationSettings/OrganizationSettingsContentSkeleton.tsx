import {
  SettingsSectionSkeleton,
  SettingsSidebarSkeleton,
} from "@/components/shared/dashboard/SettingsSkeleton";

export function OrganizationSettingsContentSkeleton() {
  return (
    <div className="flex w-full min-w-0 items-start gap-8">
      {/* Sidebar */}
      <SettingsSidebarSkeleton itemCount={2} />

      {/* Settings Content */}
      <main className="min-w-0 flex-1">
        <div className="space-y-10">
          {/* Profile */}
          <SettingsSectionSkeleton>
            <div className="space-y-6">
              {/* Section heading */}
              <div className="space-y-2">
                <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-border" />

              {/* User information */}
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-full bg-muted" />

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

              {/* Save */}
              <div className="flex justify-end pt-1">
                <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </SettingsSectionSkeleton>

          {/* Security */}
          <SettingsSectionSkeleton>
            <div className="space-y-6">
              {/* Section heading */}
              <div className="space-y-2">
                <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-border" />

              {/* Password */}
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
              </div>

              {/* Sessions */}
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />

                <div className="space-y-2">
                  <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-1">
                <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </SettingsSectionSkeleton>
        </div>
      </main>
    </div>
  );
}