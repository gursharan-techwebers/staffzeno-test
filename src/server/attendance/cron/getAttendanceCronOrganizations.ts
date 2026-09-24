"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

export async function getAttendanceCronOrganizations() {
  return prisma.organization.findMany({
    where: {
      attendanceSettings: {
        isNot: null,
      },
    },
    select: {
      id: true,
      attendanceSettings: {
        select: {
          timezone: true,
        },
      },
    },
  });
}
