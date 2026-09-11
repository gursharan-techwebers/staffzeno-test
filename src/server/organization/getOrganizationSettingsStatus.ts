import "server-only";

import { prisma } from "@/lib/prisma";

type GetOrganizationSettingsStatusParams = {
  organizationId: string;
};

export async function getOrganizationSettingsStatus({
  organizationId,
}: GetOrganizationSettingsStatusParams) {
  if (!organizationId) {
    return null;
  }

  try {
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
    console.error("[getOrganizationSettingsStatus] unexpected error:", error);

    return null;
  }
}
