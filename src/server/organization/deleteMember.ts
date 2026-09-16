"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";

import { env } from "@/env";
import { getOrganizationAdminsAndOwner } from "./getOrganizationAdminsAndOwner";
import { sendMemberRemovedEmail } from "@/sendEmails/organization/sendMemberRemovedEmail";
import { sendMemberRemovedAdminEmail } from "@/sendEmails/organization/sendMemberRemovedAdminEmail";

export type DeleteMemberSuccess = {
  memberId: string;
};

export async function deleteMember(
  organizationId: string,
  memberId: string,
): Promise<ActionResult<DeleteMemberSuccess>> {
  const normalizedOrganizationId = organizationId?.trim();
  const normalizedMemberId = memberId?.trim();

  if (!normalizedOrganizationId || !normalizedMemberId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization ID and member ID are required.",
      "BAD_REQUEST",
    );
  }

  try {
    // 1. Authenticate current user
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Unauthorized. Please log in again.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 2. Always use the authenticated active organization
    const activeOrganizationId = session.activeOrganizationId;

    if (!activeOrganizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization.",
        "FORBIDDEN",
      );
    }

    // Make sure the requested organization matches
    // the authenticated active organization.
    if (activeOrganizationId !== normalizedOrganizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    // 3. Verify current user's membership and permissions
    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId: activeOrganizationId,
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

    const isOwnerOrAdmin =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 4. Get the organization and member details BEFORE deletion.
    // These details are needed for notification emails.
    const [organization, memberToDelete] = await Promise.all([
      prisma.organization.findUnique({
        where: {
          id: activeOrganizationId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),

      prisma.member.findFirst({
        where: {
          id: normalizedMemberId,
          organizationId: activeOrganizationId,
        },
        select: {
          id: true,
          role: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "NOT_FOUND",
      );
    }

    if (!memberToDelete) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Employee not found.",
        "NOT_FOUND",
      );
    }

    // 5. Never allow the organization owner to be removed
    if (memberToDelete.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner cannot be removed.",
        "FORBIDDEN",
      );
    }

    // Prevent an admin from removing themselves accidentally.
    if (memberToDelete.userId === user.id) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You cannot remove yourself from the organization.",
        "FORBIDDEN",
      );
    }

    // Store email information before deletion.
    const removedMemberName = memberToDelete.user.name;
    const removedMemberEmail = memberToDelete.user.email;

    // 6. Remove organization membership and team memberships atomically
    await prisma.$transaction(async (tx) => {
      const teamMemberships = await tx.teamMember.findMany({
        where: {
          userId: memberToDelete.userId,
          team: {
            organizationId: activeOrganizationId,
          },
        },
        select: {
          teamId: true,
        },
      });

      if (teamMemberships.length > 0) {
        await tx.teamMember.deleteMany({
          where: {
            userId: memberToDelete.userId,
            team: {
              organizationId: activeOrganizationId,
            },
          },
        });

        // Keep Team.memberCount synchronized
        for (const { teamId } of teamMemberships) {
          await tx.team.update({
            where: {
              id: teamId,
            },
            data: {
              memberCount: {
                decrement: 1,
              },
            },
          });
        }
      }

      // Remove organization membership
      await tx.member.delete({
        where: {
          id: memberToDelete.id,
        },
      });
    });

    // 7. Send email to the removed employee.
    // Email failure must NOT fail the deletion.
    try {
      await sendMemberRemovedEmail({
        email: removedMemberEmail,
        name: removedMemberName,
        organizationName: organization.name,
      });
    } catch (emailError) {
      console.error(
        "[deleteMember] Failed to send member removed email:",
        emailError,
      );
    }

    // 8. Notify organization admins and owner.
    try {
      const recipients = await getOrganizationAdminsAndOwner({
        organizationId: activeOrganizationId,
      });

      const organizationUrl = `${env.BETTER_AUTH_URL}/org/${organization.slug}`;

      await Promise.allSettled(
        recipients.map((recipient) =>
          sendMemberRemovedAdminEmail({
            email: recipient.email,
            name: recipient.name,
            memberName: removedMemberName,
            organizationName: organization.name,
            url: organizationUrl,
          }),
        ),
      );
    } catch (emailError) {
      console.error(
        "[deleteMember] Failed to send member removal notifications:",
        emailError,
      );
    }

    // 9. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: memberToDelete.id,
      },
      "Employee removed successfully.",
    );
  } catch (error) {
    console.error("[deleteMember] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
