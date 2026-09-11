// src/server/user/getAccountSettingsUser.ts

import "server-only";

import { prisma } from "@/lib/prisma";

export type AccountSettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  hasPassword: boolean;
  lastPasswordChangedAt: Date | null;
};

export async function getAccountSettingsUser(
  userId: string,
): Promise<AccountSettingsUser | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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
          providerId: "credential",
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
    phone: user.phone ?? null,
    image: user.image ?? null,
    lastPasswordChangedAt: user.lastPasswordChangedAt ?? null,
    hasPassword: user.accounts.length > 0,
  };
}
