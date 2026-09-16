import "server-only";

import { prisma } from "@/lib/prisma";

type GetIsTeamAdminParams = {
  organizationId: string;
  userId: string;
};

export async function getIsTeamAdmin({
  organizationId,
  userId,
}: GetIsTeamAdminParams): Promise<boolean> {
  if (!organizationId || !userId) {
    return false;
  }

  const teamAdmin = await prisma.teamMember.findFirst({
    where: {
      userId,
      role: "admin",
      team: {
        organizationId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(teamAdmin);
}