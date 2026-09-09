"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

export type OrganizationSettingsStatus = {
  organizationId: string;
  organizationSlug: string;
  general: boolean;
  attendance: boolean;
  leave: boolean;
  configured: boolean;
};

export async function getOrganizationSettingsStatus(): Promise<
  OrganizationSettingsStatus | null
> {
  try {
    const requestHeaders = await headers();
    const session = await getSession();

    if (!session?.user) {
      return null;
    }

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return null;
    }

    const organizationId = activeMember.organizationId;

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,

        attendanceSettings: {
          select: {
            id: true,
          },
        },

        leaveSettings: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    const general =
      organization.name.trim().length > 0 &&
      !!organization.email?.trim() &&
      !!organization.phone?.trim();

    const attendance = organization.attendanceSettings !== null;

    const leave = organization.leaveSettings !== null;

    return {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      general,
      attendance,
      leave,
      configured: general && attendance && leave,
    };
  } catch (error) {
    console.error(
      "[getOrganizationSettingsStatus] unexpected error:",
      error,
    );

    return null;
  }
}