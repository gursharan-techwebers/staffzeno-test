"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import { getSession } from "./getSession";

export async function getUserSessions() {
  const currentSession = await getSession();

  if (!currentSession?.user) {
    return [];
  }

  const currentSessionId = currentSession.session.id;

  const sessions = await prisma.session.findMany({
    where: {
      userId: currentSession.user.id,
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

  return sessions.map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
}
