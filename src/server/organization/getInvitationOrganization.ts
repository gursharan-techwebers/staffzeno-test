import "server-only";

import { prisma } from "@/lib/prisma";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

type GetInvitationOrganizationSuccess = {
  name: string;
};

export async function getInvitationOrganization(
  invitationId: string,
): Promise<ActionResult<GetInvitationOrganizationSuccess>> {
  const id = invitationId.trim();

  if (!id) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invalid or missing invitation.",
      "INVALID_INVITATION",
    );
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: {
        id,
      },
      select: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation?.organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation or organization not found.",
        "INVALID_INVITATION",
      );
    }

    return actionResponse(ACTION_STATUS.OK, {
      name: invitation.organization.name,
    });
  } catch (error) {
    console.error("[getInvitationOrganization] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
