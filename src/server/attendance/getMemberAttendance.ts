"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import type { Attendance } from "@/types/organization/attendance";

type GetMemberAttendanceInput = {
  organizationId: string;
  memberId: string;
};

export async function getMemberAttendance({
  organizationId,
  memberId,
}: GetMemberAttendanceInput): Promise<Attendance[]> {
  const startedAt = performance.now();

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        organizationId,
        memberId,
      },

      orderBy: {
        date: "desc",
      },

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
      },
    });

    return attendance;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] getMemberAttendance failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    throw new Error(
      "Something went wrong while loading your attendance.",
    );
  } finally {
    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] getMemberAttendance:total: ${totalTime.toFixed(2)} ms`,
    );
  }
}