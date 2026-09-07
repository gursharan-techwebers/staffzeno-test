import "server-only";

import { prisma } from "@/lib/prisma";

export async function getTeamNameById(
  teamId: string,
): Promise<string | null> {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    select: {
      name: true,
    },
  });

  return team?.name ?? null;
}