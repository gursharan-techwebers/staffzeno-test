import "server-only";

import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

export async function getActiveOrganization() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return null;
  }

  const organizationId = authContext.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  return prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      logo: true,
      slug: true,
    },
  });
}