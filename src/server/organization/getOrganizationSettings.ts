import "server-only";

import { prisma } from "@/lib/prisma";

type GetOrganizationSettingsParams = {
  organizationId: string;
};

export async function getOrganizationSettings({
  organizationId,
}: GetOrganizationSettingsParams) {
  if (!organizationId) return null;

  return prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });
}