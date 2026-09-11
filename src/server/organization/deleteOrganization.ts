"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

type DeletedOrganization = {
  id: string;
};

export async function deleteOrganization(): Promise<
  ActionResult<DeletedOrganization>
> {
  try {
    // --------------------------------------------------
    // 1. Authenticate current user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 2. Get active organization
    // --------------------------------------------------

    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 3. Verify current user is the organization owner
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    if (currentMember.role !== "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only the organization owner can delete the organization.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Delete organization
    // --------------------------------------------------

    await prisma.organization.delete({
      where: {
        id: organizationId,
      },
    });

    // --------------------------------------------------
    // 5. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        id: organizationId,
      },
      "The organization has been permanently deleted.",
    );
  } catch (error) {
    console.error("[deleteOrganization] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to delete the organization.",
      "UNKNOWN_ERROR",
    );
  }
}
