import "server-only";

import { prisma } from "@/lib/prisma";
import { Team } from "@/types/organization/team";

export type OrganizationRole = "owner" | "admin" | "member";

type TeamsPageData = {
  role: OrganizationRole;
  teams: Team[];
};

type GetTeamsPageDataParams = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
};

export async function getTeamsPageData({
  organizationId,
  userId,
  role,
}: GetTeamsPageDataParams): Promise<TeamsPageData> {
  const canManageTeams = role === "owner" || role === "admin";

  const teams = await prisma.team.findMany({
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

  return {
    role,

    teams: teams.map((team) => ({
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
    })),
  };
}
