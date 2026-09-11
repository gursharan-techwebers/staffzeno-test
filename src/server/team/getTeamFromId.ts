import "server-only";

import { prisma } from "@/lib/prisma";

export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  title: string | null;
  email: string;
  image: string | null;
  role: "member" | "admin";
  createdAt: Date | null;
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: Date;
  members: TeamMember[];
};

type GetTeamFromIdParams = {
  teamId: string;
  organizationId: string;
};

export async function getTeamFromId({
  teamId,
  organizationId,
}: GetTeamFromIdParams): Promise<Team | null> {
  if (!teamId || !organizationId) {
    return null;
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
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
              id: true,
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
      },
    },
  });

  if (!team) {
    return null;
  }

  return {
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
  };
}
