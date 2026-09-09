"use server";

import { prisma } from "@/lib/prisma";

import { updateAttendanceSettingsSchema } from "@/validators/organization/settings/attendance";

import { getSession } from "../user/getSession";
import { ORGANIZATION_DEFAULT_SETTINGS } from "@/constants/organizationDefaultSettings";

export async function getOrganizationAttendanceSettings() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const organizationId =
    session.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  const settings =
    await prisma.organizationAttendanceSettings.findUnique({
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

  /**
   * No database settings yet.
   * Return organization defaults.
   */
  if (!settings) {
    return ORGANIZATION_DEFAULT_SETTINGS.attendance;
  }

  const parsed =
    updateAttendanceSettingsSchema.safeParse(settings);

  if (!parsed.success) {
    console.error(
      "[getOrganizationAttendanceSettings] Invalid settings:",
      parsed.error.flatten(),
    );

    return ORGANIZATION_DEFAULT_SETTINGS.attendance;
  }

  return parsed.data;
}