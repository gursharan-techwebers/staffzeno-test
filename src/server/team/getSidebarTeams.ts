// src/server/team/getSidebarTeams.ts

import "server-only";

import { prisma } from "@/lib/prisma";

export type SidebarTeam = {
  id: string;
  name: string;
};

type GetSidebarTeamsParams = {
  organizationId: string;
  userId: string;
  canManageTeams: boolean;
};

export async function getSidebarTeams({
  organizationId,
  userId,
  canManageTeams,
}: GetSidebarTeamsParams): Promise<SidebarTeam[]> {
  return prisma.team.findMany({
    where: canManageTeams
      ? {
          organizationId,
        }
      : {
          organizationId,
          teammembers: {
            some: {
              userId,
            },
          },
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