import "server-only";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import type { Invitation } from "@/types/organization/invitation";

type GetUserInvitationsParams = {
  organizationId: string;
  userId: string;
  userEmail: string;
};

type GetUserInvitationsSuccess = {
  sent: Invitation[];
  received: Invitation[];
};

export async function getUserInvitations({
  organizationId,
  userId,
  userEmail,
}: GetUserInvitationsParams): Promise<ActionResult<GetUserInvitationsSuccess>> {
  if (!organizationId || !userId || !userEmail) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "User and organization context is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const [sent, received] = await Promise.all([
      // --------------------------------------------------
      // Invitations sent by the current user
      // --------------------------------------------------
      prisma.invitation.findMany({
        where: {
          organizationId,
          inviterId: userId,
        },

        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          email: true,
          title: true,
          organizationId: true,
          role: true,
          status: true,

          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      // --------------------------------------------------
      // Invitations received by the current user's email
      // --------------------------------------------------
      prisma.invitation.findMany({
        where: {
          organizationId,
          email: userEmail,
        },

        select: {
          id: true,
          email: true,
          title: true,
          role: true,
          status: true,
          organizationId: true,
          inviterId: true,
          expiresAt: true,
          createdAt: true,

          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return actionResponse(
      ACTION_STATUS.OK,
      {
        sent,
        received,
      },
      "Invitations loaded successfully.",
    );
  } catch (error) {
    console.error("[getUserInvitations] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to load invitations.",
      "UNKNOWN_ERROR",
    );
  }
}
