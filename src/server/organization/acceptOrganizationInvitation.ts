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

import { canAcceptInvitation } from "../billing/canAcceptInvitation";
import { getSession } from "../user/getSession";

type AcceptOrganizationInvitationInput = {
  invitationId: string;
};

type AcceptOrganizationInvitationSuccess = {
  userId: string;
  organizationSlug: string;
};

export async function acceptOrganizationInvitation(
  input: AcceptOrganizationInvitationInput,
): Promise<ActionResult<AcceptOrganizationInvitationSuccess>> {
  // --------------------------------------------------
  // 1. Validate invitation ID
  // --------------------------------------------------
  if (!input.invitationId?.trim()) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invalid or missing invitation.",
      "INVALID_INVITATION",
    );
  }

  try {
    const requestHeaders = await headers();

    // --------------------------------------------------
    // 2. Check authentication
    // --------------------------------------------------
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to accept this invitation.",
        "UNAUTHORIZED",
      );
    }

    // --------------------------------------------------
    // 3. Get invitation
    // --------------------------------------------------
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: input.invitationId,
      },
      select: {
        id: true,
        email: true,
        title: true,
        role: true,
        organizationId: true,
        teamId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation not found.",
        "INVALID_INVITATION",
      );
    }

    // --------------------------------------------------
    // 4. Check invitation status
    // --------------------------------------------------
    if (invitation.status !== "pending") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "This invitation is no longer valid.",
        "INVITATION_NOT_PENDING",
      );
    }

    // --------------------------------------------------
    // 5. Check invitation expiration
    // --------------------------------------------------
    if (invitation.expiresAt <= new Date()) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "This invitation has expired.",
        "INVITATION_EXPIRED",
      );
    }

    // --------------------------------------------------
    // 6. Verify invited email
    // --------------------------------------------------
    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "This invitation was sent to a different email address. Please sign in with the invited account.",
        "EMAIL_MISMATCH",
      );
    }

    // --------------------------------------------------
    // 7. Team is required
    // --------------------------------------------------
    if (!invitation.teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "This invitation does not have a team assigned. Please contact your organization administrator.",
        "TEAM_REQUIRED",
      );
    }

    // --------------------------------------------------
    // 8. Verify organization exists
    // --------------------------------------------------
    const organization = await prisma.organization.findUnique({
      where: {
        id: invitation.organizationId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "The organization associated with this invitation no longer exists.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 9. Verify team belongs to organization
    // --------------------------------------------------
    const team = await prisma.team.findFirst({
      where: {
        id: invitation.teamId,
        organizationId: invitation.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "The team assigned to this invitation no longer exists.",
        "TEAM_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 10. Check if user is already a member
    // --------------------------------------------------
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You are already a member of this organization.",
        "ALREADY_MEMBER",
      );
    }

    // --------------------------------------------------
    // 11. Check billing / employee capacity
    // --------------------------------------------------
    const canAccept = await canAcceptInvitation(
      session.user.id,
      invitation.organizationId,
      invitation.id,
    );

    if (!canAccept) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "This organization has reached its employee limit. The invitation cannot be accepted until a seat becomes available.",
        "LIMIT_REACHED",
      );
    }

    // --------------------------------------------------
    // 12. Accept invitation
    //
    // Better Auth automatically adds the invited user
    // to invitation.teamId when the invitation is accepted.
    // --------------------------------------------------
    const result = await auth.api.acceptInvitation({
      body: {
        invitationId: invitation.id,
      },
      headers: requestHeaders,
    });

    if (!result?.member) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Unable to accept this invitation.",
        "INVALID_INVITATION",
      );
    }

    // --------------------------------------------------
    // 13. Verify created member belongs to organization
    // --------------------------------------------------
    const memberId = result.member.id;
    const organizationId = result.member.organizationId;

    if (organizationId !== invitation.organizationId) {
      console.error("[acceptOrganizationInvitation] Organization mismatch:", {
        memberId,
        expectedOrganizationId: invitation.organizationId,
        actualOrganizationId: organizationId,
      });

      return actionResponse(
        ACTION_STATUS.INTERNAL_SERVER_ERROR,
        "The invitation could not be processed correctly.",
        "ORGANIZATION_MISMATCH",
      );
    }

    // --------------------------------------------------
    // 14. Save employee title
    // --------------------------------------------------
    await prisma.member.update({
      where: {
        id: memberId,
      },
      data: {
        title: invitation.title,
        role: invitation.role ?? "member",
      },
    });

    // --------------------------------------------------
    // 15. Verify Better Auth added user to the team
    // --------------------------------------------------
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!teamMembership) {
      console.error("[acceptOrganizationInvitation] Team membership missing:", {
        userId: session.user.id,
        teamId: team.id,
        organizationId,
      });

      return actionResponse(
        ACTION_STATUS.INTERNAL_SERVER_ERROR,
        "Your organization membership was created, but the required team assignment could not be completed.",
        "TEAM_MEMBERSHIP_FAILED",
      );
    }

    // --------------------------------------------------
    // 16. Set organization as active
    // --------------------------------------------------
    await auth.api.setActiveOrganization({
      body: {
        organizationId,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 17. Return success
    // --------------------------------------------------
    return actionResponse(
      ACTION_STATUS.OK,
      {
        userId: session.user.id,
        organizationSlug: organization.slug,
      },
      "Invitation accepted successfully.",
    );
  } catch (error) {
    // --------------------------------------------------
    // 18. Better Auth errors
    // --------------------------------------------------
    if (error instanceof APIError) {
      console.error(
        "[acceptOrganizationInvitation] Better Auth error:",
        error.body,
      );

      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to accept this invitation.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 19. Unexpected errors
    // --------------------------------------------------
    console.error("[acceptOrganizationInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while accepting the invitation. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
