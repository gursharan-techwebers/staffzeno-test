import "server-only";

import { prisma } from "@/lib/prisma";

export type OrganizationTeamOption = {
  id: string;
  name: string;
};

type GetOrganizationTeamsParams = {
  organizationId: string;
};

export async function getOrganizationTeams({
  organizationId,
}: GetOrganizationTeamsParams): Promise<OrganizationTeamOption[]> {
  if (!organizationId) {
    return [];
  }

  return prisma.team.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}