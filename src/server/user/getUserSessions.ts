import "server-only";

import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

export async function getUserSessions() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return [];
  }

  const { session, user } = authContext;

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return sessions.map((item) => ({
    ...item,
    isCurrent: item.id === session.id,
  }));
}
