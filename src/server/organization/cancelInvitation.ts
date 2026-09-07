"use server";

import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

type CancelInvitationSuccess = {
  invitationId: string;
};

export async function cancelInvitation(
  invitationId: string,
): Promise<ActionResult<CancelInvitationSuccess>> {
  if (!invitationId?.trim()) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invitation ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const requestHeaders = await headers();

    // 1. Check authentication
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    // 2. Get active organization member
    const member = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of an active organization.",
        "FORBIDDEN",
      );
    }

    // 3. Only owner and admin can manage invitations
    const isOwnerOrAdmin = member.role === "owner" || member.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 4. Make sure invitation belongs to active organization
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: member.organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation not found.",
        "INVALID_INVITATION",
      );
    }

    // 5. Only pending invitations can be cancelled
    if (invitation.status !== "pending") {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "Only pending invitations can be cancelled.",
        "CONFLICT",
      );
    }

    // 6. Cancel using Better Auth
    await auth.api.cancelInvitation({
      body: {
        invitationId: invitation.id,
      },
      headers: requestHeaders,
    });

    return actionResponse(
      ACTION_STATUS.OK,
      {
        invitationId: invitation.id,
      },
      "Invitation cancelled successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to cancel the invitation.",
        "BAD_REQUEST",
      );
    }

    console.error("[cancelInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
