import "server-only";

import { prisma } from "@/lib/prisma";

type GetOrganizationAdminsAndOwnerParams = {
  organizationId: string;
};

export async function getOrganizationAdminsAndOwner({
  organizationId,
}: GetOrganizationAdminsAndOwnerParams) {
  if (!organizationId) {
    return [];
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      createdById: true,

      members: {
        where: {
          role: "admin",
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!organization) {
    return [];
  }

  const recipients = organization.members.map(({ user }) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
  }));

  // Owner may also be an admin/member, so avoid duplicate emails.
  if (organization.createdById) {
    const owner = await prisma.user.findUnique({
      where: {
        id: organization.createdById,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (
      owner &&
      !recipients.some((recipient) => recipient.userId === owner.id)
    ) {
      recipients.push({
        userId: owner.id,
        name: owner.name,
        email: owner.email,
      });
    }
  }

  return recipients;
}
