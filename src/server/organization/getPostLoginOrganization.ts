import "server-only";

import { prisma } from "@/lib/prisma";
import { getLastActiveOrganizationCookie } from "@/server/organization/organizationCookie";

export type PostLoginOrganization = {
  organizationId: string;
  organizationSlug: string;
};

/**
 * Finds the organization the user should enter after login.
 *
 * Priority:
 * 1. Last active organization stored in the cookie,
 *    if the user still belongs to it.
 * 2. User's oldest organization as a fallback.
 *
 * This function is read-only.
 * It does NOT create or modify cookies.
 */
export async function getPostLoginOrganization(
  userId: string,
): Promise<PostLoginOrganization | null> {
  if (!userId) {
    return null;
  }

  // ---------------------------------------------------------
  // 1. Get the last active organization ID from the cookie
  // ---------------------------------------------------------

  const lastOrganizationId = await getLastActiveOrganizationCookie();

  // ---------------------------------------------------------
  // 2. Validate the last active organization
  // ---------------------------------------------------------

  if (lastOrganizationId) {
    const lastOrganization = await prisma.organization.findFirst({
      where: {
        id: lastOrganizationId,

        // Make sure the logged-in user still belongs
        // to this organization.
        members: {
          some: {
            userId,
          },
        },
      },

      select: {
        id: true,
        slug: true,
      },
    });

    if (lastOrganization) {
      return {
        organizationId: lastOrganization.id,
        organizationSlug: lastOrganization.slug,
      };
    }
  }

  // ---------------------------------------------------------
  // 3. Fallback to the user's first organization
  // ---------------------------------------------------------

  const firstOrganization = await prisma.organization.findFirst({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },

    select: {
      id: true,
      slug: true,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  // ---------------------------------------------------------
  // 4. User has no organization
  // ---------------------------------------------------------

  if (!firstOrganization) {
    return null;
  }

  // ---------------------------------------------------------
  // 5. Return fallback organization
  // ---------------------------------------------------------

  return {
    organizationId: firstOrganization.id,
    organizationSlug: firstOrganization.slug,
  };
}
