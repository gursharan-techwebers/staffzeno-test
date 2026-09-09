"use server";

import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

export async function getActiveOrganization() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  const organization = await prisma.organization.findUnique({
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

  return organization;
}