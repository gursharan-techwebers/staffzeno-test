"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

type DeletedOrganization = {
  id: string;
};

export async function deleteOrganization(): Promise<
  ActionResult<DeletedOrganization>
> {
  try {
    // --------------------------------------------------
    // 1. Get current session
    // --------------------------------------------------

    const requestHeaders = await headers();

    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    // --------------------------------------------------
    // 2. Get active organization member
    // --------------------------------------------------

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const organizationId = activeMember.organizationId;

    // --------------------------------------------------
    // 3. Only organization owner can delete
    // --------------------------------------------------

    if (activeMember.role !== "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only the organization owner can delete the organization.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Check organization exists
    // --------------------------------------------------

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 5. Delete organization
    // --------------------------------------------------

    await prisma.organization.delete({
      where: {
        id: organizationId,
      },
    });

    // --------------------------------------------------
    // 6. Return success
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
