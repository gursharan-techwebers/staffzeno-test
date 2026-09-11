import "server-only";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import type { Invitation } from "@/types/organization/invitation";
import { getSession } from "./getSession";

type GetUserInvitationsSuccess = {
  sent: Invitation[];
  received: Invitation[];
};

export async function getUserInvitations(): Promise<
  ActionResult<GetUserInvitationsSuccess>
> {
  try {
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const organizationId = session.session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const [sent, received] = await Promise.all([
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
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          organizationId: true,
          role: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.invitation.findMany({
        where: {
          organizationId,
          email: userEmail,
        },
        select: {
          id: true,
          email: true,
          title: true, // <-- ADD THIS
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
