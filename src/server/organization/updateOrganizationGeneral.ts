"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import {
  updateOrganizationGeneralSchema,
  type UpdateOrganizationGeneralInput,
} from "@/validators/organization/settings/general";

import { getAuthContext } from "../auth/getAuthContext";

type UpdatedOrganization = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export async function updateOrganizationGeneral(
  values: UpdateOrganizationGeneralInput,
): Promise<ActionResult<UpdatedOrganization>> {
  // 1. Validate input first
  const validation =
    updateOrganizationGeneralSchema.safeParse(values);

  if (!validation.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please correct the highlighted fields.",
      "VALIDATION_ERROR",
      validation.error.flatten().fieldErrors,
    );
  }

  const data = validation.data;

  try {
    // 2. Get authenticated user/session
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 3. Get active organization
    const organizationId =
      session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 4. Verify membership and permission
    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    if (member.role !== "owner" && member.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization admins and owners can update organization settings.",
        "FORBIDDEN",
      );
    }

    // 5. Update organization
    const updatedOrganization =
      await prisma.organization.update({
        where: {
          id: organizationId,
        },

        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      });

    // 6. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      updatedOrganization,
      "Your organization information has been updated.",
    );
  } catch (error) {
    console.error(
      "[updateOrganizationGeneral] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update organization information.",
      "UNKNOWN_ERROR",
    );
  }
}