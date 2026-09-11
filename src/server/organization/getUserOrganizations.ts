import "server-only";

import { prisma } from "@/lib/prisma";

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

type GetUserOrganizationsParams = {
  userId: string;
};

export async function getUserOrganizations({
  userId,
}: GetUserOrganizationsParams): Promise<UserOrganization[]> {
  if (!userId) {
    return [];
  }

  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },

    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },

    orderBy: {
      name: "asc",
    },
  });

  return organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo ?? null,
  }));
}
