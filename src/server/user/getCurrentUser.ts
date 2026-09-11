import "server-only";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/server/auth/getAuthContext";

export async function getAccountSettingsUser() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return null;
  }

  const { user } = authContext;

  const accountData = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      phone: true,
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

  if (!accountData) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: accountData.phone,
    image: user.image,
    lastPasswordChangedAt: accountData.lastPasswordChangedAt,
    hasPassword: accountData.accounts.length > 0,
  };
}
