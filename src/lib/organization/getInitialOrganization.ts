import { prisma } from "@/lib/prisma";

export async function getInitialOrganization(userId: string) {
  const member = await prisma.member.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      organizationId: true,
    },
  });

  return member?.organizationId ?? null;
}