import "server-only";

import { prisma } from "@/lib/prisma";
import { Team } from "@/types/organization/team";

type GetUserTeamsParams = {
  organizationId: string;
  userId: string;
};

export async function getUserTeams({
  organizationId,
  userId,
}: GetUserTeamsParams): Promise<Team[]> {
  const teams = await prisma.team.findMany({
    where: {
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
      memberCount: true,
      createdAt: true,

      teammembers: {
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,

          user: {
            select: {
              name: true,
              email: true,
              image: true,

              members: {
                where: {
                  organizationId,
                },
                select: {
                  title: true,
                },
                take: 1,
              },
            },
          },
        },

        orderBy: {
          user: {
            name: "asc",
          },
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    memberCount: team.memberCount,
    createdAt: team.createdAt,

    members: team.teammembers.map((member) => ({
      id: member.id,
      userId: member.userId,

      name: member.user.name,
      email: member.user.email,
      image: member.user.image,

      title: member.user.members[0]?.title ?? null,

      role: member.role,
      createdAt: member.createdAt,
    })),
  }));
}
