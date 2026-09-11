"use server";

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
import { getAuthContext } from "../auth/getAuthContext";

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
  const invitationId = input.invitationId?.trim();

  // --------------------------------------------------
  // 1. Validate invitation ID
  // --------------------------------------------------
  if (!invitationId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invalid or missing invitation.",
      "INVALID_INVITATION",
    );
  }

  try {
    // --------------------------------------------------
    // 2. Authentication
    // --------------------------------------------------
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to accept this invitation.",
        "UNAUTHORIZED",
      );
    }

    const { user } = authContext;

    // Get headers only when needed by Better Auth.
    const requestHeaders = await headers();

    // --------------------------------------------------
    // 3. Get invitation
    // --------------------------------------------------
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: invitationId,
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
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
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
    // 8. Verify organization and team
    // --------------------------------------------------
    const [organization, team] = await Promise.all([
      prisma.organization.findUnique({
        where: {
          id: invitation.organizationId,
        },
        select: {
          id: true,
          slug: true,
        },
      }),

      prisma.team.findFirst({
        where: {
          id: invitation.teamId,
          organizationId: invitation.organizationId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "The organization associated with this invitation no longer exists.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    if (!team) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "The team assigned to this invitation no longer exists.",
        "TEAM_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 9. Check existing membership
    // --------------------------------------------------
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: user.id,
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
    // 10. Check billing / employee capacity
    // --------------------------------------------------
    const canAccept = await canAcceptInvitation(
      user.id,
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
    // 11. Accept invitation
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
    // 12. Verify organization
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
    // 13. Save employee title and role
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
    // 14. Verify team membership
    // --------------------------------------------------
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!teamMembership) {
      console.error("[acceptOrganizationInvitation] Team membership missing:", {
        userId: user.id,
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
    // 15. Set organization as active
    // --------------------------------------------------
    await auth.api.setActiveOrganization({
      body: {
        organizationId,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 16. Return success
    // --------------------------------------------------
    return actionResponse(
      ACTION_STATUS.OK,
      {
        userId: user.id,
        organizationSlug: organization.slug,
      },
      "Invitation accepted successfully.",
    );
  } catch (error) {
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

    console.error("[acceptOrganizationInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while accepting the invitation. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
