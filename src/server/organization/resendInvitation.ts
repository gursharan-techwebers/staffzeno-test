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
import { getUserInvitations } from "@/server/user/getUserInvitations";

import type { Invitation } from "@/types/organization/invitation";

import { getSession } from "../user/getSession";

export type ResendInvitationSuccess = Invitation;

export async function resendInvitation(
  invitationId: string,
): Promise<ActionResult<ResendInvitationSuccess>> {
  if (!invitationId?.trim()) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invitation ID is required.",
      "INVALID_INVITATION",
    );
  }

  try {
    const requestHeaders = await headers();

    // 1. Authenticate user
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    // 2. Get the user's active organization membership
    const member = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You are not a member of an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 3. Only admins and owners can resend invitations
    const isOwnerOrAdmin = member.role === "owner" || member.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 4. Get invitations for the active organization
    const invitations = await getUserInvitations();

    if (!invitations.success) {
      return actionResponse(
        invitations.status,
        invitations.error,
        invitations.code,
        invitations.fieldErrors,
      );
    }

    // 5. Find the requested invitation
    const invitation = invitations.data.sent.find(
      (item) => item.id === invitationId,
    );

    if (!invitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation not found.",
        "INVALID_INVITATION",
      );
    }

    // 6. Extra organization-level security check
    if (invitation.organizationId !== member.organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this invitation.",
        "FORBIDDEN",
      );
    }

    // 7. Only pending invitations can be resent
    if (invitation.status !== "pending") {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "Only pending invitations can be resent.",
        "CONFLICT",
      );
    }

    // 8. Cancel the old invitation
    await auth.api.cancelInvitation({
      body: {
        invitationId: invitation.id,
      },
      headers: requestHeaders,
    });

    // 9. Create a fresh invitation
    //    Preserve the original title.
    if (!invitation.title) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "The invitation title is missing and cannot be resent.",
        "BAD_REQUEST",
      );
    }

    await auth.api.createInvitation({
      body: {
        email: invitation.email,
        role: "member",
        organizationId: invitation.organizationId,
        title: invitation.title,
      },
      headers: requestHeaders,
    });

    // 10. Fetch the latest invitations
    const updatedInvitations = await getUserInvitations();

    if (!updatedInvitations.success) {
      return actionResponse(
        updatedInvitations.status,
        updatedInvitations.error,
        updatedInvitations.code,
        updatedInvitations.fieldErrors,
      );
    }

    // 11. Find the newest pending invitation
    //     for this email in the active organization.
    const updatedInvitation = updatedInvitations.data.sent
      .filter(
        (item) =>
          item.organizationId === member.organizationId &&
          item.email.toLowerCase() === invitation.email.toLowerCase() &&
          item.status === "pending",
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!updatedInvitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation was resent, but the new invitation could not be found.",
        "INVALID_INVITATION",
      );
    }

    // 12. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      updatedInvitation,
      "Invitation resent successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to resend the invitation.",
        "BAD_REQUEST",
      );
    }

    console.error("[resendInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
