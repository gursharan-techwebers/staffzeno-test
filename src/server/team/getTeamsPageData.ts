import "server-only";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/user/getSession";
import { Team } from "@/types/organization/team";

export type OrganizationRole = "owner" | "admin" | "member";

type TeamsPageData = {
  role: OrganizationRole;
  teams: Team[];
};

export async function getTeamsPageData(): Promise<TeamsPageData | null> {
  // Get session only once.
  const session = await getSession();

  if (!session) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  // Get membership + role in one query.
  const membership = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  const role = membership.role as OrganizationRole;

  const canManageTeams = role === "owner" || role === "admin";

  // Get only the teams the user is allowed to see.
  const teams = await prisma.team.findMany({
    where: canManageTeams
      ? {
          organizationId,
        }
      : {
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
