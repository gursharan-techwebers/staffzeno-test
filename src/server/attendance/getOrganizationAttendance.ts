"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import type { ManageAttendance } from "@/types/organization/attendance";

type GetOrganizationAttendanceInput = {
  organizationId: string;
};

export async function getOrganizationAttendance({
  organizationId,
}: GetOrganizationAttendanceInput): Promise<ManageAttendance[]> {
  const startedAt = performance.now();

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        organizationId,
      },

      orderBy: [
        {
          date: "desc",
        },
        {
          member: {
            user: {
              name: "asc",
            },
          },
        },
      ],

      select: {
        id: true,
        organizationId: true,
        memberId: true,
        date: true,
        timezone: true,
        requiredMinutes: true,
        workedMinutes: true,
        regularMinutes: true,
        overtimeMinutes: true,
        shortfallMinutes: true,
        status: true,
        isFinalized: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,

        member: {
          select: {
            id: true,
            userId: true,
            role: true,
            title: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return attendance;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] getOrganizationAttendance failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    throw new Error(
      "Something went wrong while loading organization attendance.",
    );
  } finally {
    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] getOrganizationAttendance:total: ${totalTime.toFixed(2)} ms`,
    );
  }
}
