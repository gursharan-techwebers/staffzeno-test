import "server-only";

import { prisma } from "@/lib/prisma";

import { updateAttendanceSettingsSchema } from "@/validators/organization/settings/attendance";

type GetOrganizationAttendanceSettingsParams = {
  organizationId: string;
};

export async function getOrganizationAttendanceSettings({
  organizationId,
}: GetOrganizationAttendanceSettingsParams) {
  if (!organizationId) {
    return null;
  }

  const settings = await prisma.organizationAttendanceSettings.findUnique({
    where: {
      organizationId,
    },
    select: {
      officeStartTime: true,
      officeEndTime: true,
      gracePeriod: true,
      workingDays: true,
      workingSaturdays: true,
    },
  });

  // No attendance settings configured yet.
  if (!settings) {
    return null;
  }

  const parsed = updateAttendanceSettingsSchema.safeParse(settings);

  if (!parsed.success) {
    console.error(
      "[getOrganizationAttendanceSettings] Invalid settings:",
      parsed.error.flatten(),
    );

    return null;
  }

  return parsed.data;
}
