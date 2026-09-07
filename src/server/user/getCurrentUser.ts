"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import { getSession } from "./getSession";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      lastPasswordChangedAt: true,
      accounts: {
        where: {
          password: {
            not: null,
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: user.image,
    lastPasswordChangedAt: user.lastPasswordChangedAt,
    hasPassword: user.accounts.length > 0,
  };
}
