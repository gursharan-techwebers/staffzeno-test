"use client";

import {
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import GeneralSettings from "./GeneralSettings";
import AttendanceSettings from "./AttendanceSettings";
import LeaveManagementSettings from "./LeaveManagementSettings";
import DangerSettings from "./DangerSettings";

import type {
  WorkingDay,
  WorkingSaturday,
} from "@/validators/organization/settings/attendance";

type OrganizationSettingsContentProps = {
  organization: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };

  attendanceSettings: {
    officeStartTime: string;
    officeEndTime: string;
    gracePeriod: number;
    workingDays: WorkingDay[];
    workingSaturdays: WorkingSaturday[];
  } | null;

  leaveSettings: {
    monthlyPaidLeaves: number;
    monthlyPaidHalfDayLeaves: number;
    monthlyPaidShortLeaves: number;
    shortLeaveDuration: number;
    carryForwardEnabled: boolean;
    leaveEncashmentEnabled: boolean;
  } | null;
};

const OrganizationSettingsContent = ({
  organization,
  attendanceSettings,
  leaveSettings,
}: OrganizationSettingsContentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");

  const activeTab =
    tabFromUrl === "attendance" ||
    tabFromUrl === "leave" ||
    tabFromUrl === "danger"
      ? tabFromUrl
      : "general";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === "general") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        {/* General */}

        <TabsTrigger
          value="general"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Building2Icon className="size-4" />
          General
        </TabsTrigger>

        {/* Attendance */}

        <TabsTrigger
          value="attendance"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <CalendarClockIcon className="size-4" />
          Attendance
        </TabsTrigger>

        {/* Leave */}

        <TabsTrigger
          value="leave"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <ClipboardListIcon className="size-4" />
          Leave
        </TabsTrigger>

        {/* Danger Zone */}

        <TabsTrigger
          value="danger"
          className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
        >
          <TriangleAlertIcon className="size-4" />
          Danger Zone
        </TabsTrigger>
      </TabsList>

      {/* General */}

      <TabsContent value="general" className="mt-6">
        <GeneralSettings organization={organization} />
      </TabsContent>

      {/* Attendance */}

      <TabsContent value="attendance" className="mt-6">
        <AttendanceSettings settings={attendanceSettings} />
      </TabsContent>

      {/* Leave */}

      <TabsContent value="leave" className="mt-6">
        <LeaveManagementSettings settings={leaveSettings} />
      </TabsContent>

      {/* Danger Zone */}

      <TabsContent value="danger" className="mt-6">
        <DangerSettings
          organization={{
            id: organization.id,
            name: organization.name,
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationSettingsContent;
