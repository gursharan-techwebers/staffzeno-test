"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

export async function getAttendanceTimezone(
  organizationId: string,
): Promise<string> {
  const settings = await prisma.organizationAttendanceSettings.findUnique({
    where: {
      organizationId,
    },
    select: {
      timezone: true,
    },
  });

  if (!settings) {
    throw new Error(
      "Attendance settings are not configured for this organization.",
    );
  }

  if (!settings.timezone) {
    throw new Error(
      "Attendance timezone is not configured for this organization.",
    );
  }

  return settings.timezone;
}
