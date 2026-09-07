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

export async function getTeamFromId(
  teamId: string,
): Promise<Team | null> {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      teammembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    return null;
  }

  const organizationMembers = await prisma.member.findMany({
    where: {
      organizationId: team.organizationId,
      userId: {
        in: team.teammembers.map((member) => member.userId),
      },
    },
    select: {
      userId: true,
      title: true,
    },
  });

  const titleByUserId = new Map(
    organizationMembers.map((member) => [
      member.userId,
      member.title,
    ]),
  );

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
      title: titleByUserId.get(member.userId) ?? null,
      role: member.role,
      createdAt: member.createdAt,
    })),
  };
}