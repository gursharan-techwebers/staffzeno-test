import "server-only";

import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";
import { Team } from "@/types/organization/team";

export async function getUserTeams(): Promise<Team[]> {
  const session = await getSession();

  if (!session) {
    return [];
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return [];
  }

  // Verify the user belongs to the active organization.
  const membership = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return [];
  }

  const teams = await prisma.team.findMany({
    where: {
      organizationId,

      teammembers: {
        some: {
          userId: session.user.id,
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
      // TeamMember.id
      id: member.id,

      // User.id
      userId: member.userId,

      // User details
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,

      // Organization Member details
      title: member.user.members[0]?.title ?? null,

      // TeamMember details
      role: member.role,
      createdAt: member.createdAt,
    })),
  }));
}
