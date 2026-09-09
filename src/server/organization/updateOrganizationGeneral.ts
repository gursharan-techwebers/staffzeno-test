"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
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

import { getSession } from "../user/getSession";

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
    // 3. Check organization permission
    // --------------------------------------------------

    if (activeMember.role !== "owner" && activeMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization admins and owners can update organization settings.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Validate input
    // --------------------------------------------------

    const validation = updateOrganizationGeneralSchema.safeParse(values);

    if (!validation.success) {
      return actionResponse(
        ACTION_STATUS.VALIDATION_ERROR,
        "Please correct the highlighted fields.",
        "VALIDATION_ERROR",
        validation.error.flatten().fieldErrors,
      );
    }

    const data = validation.data;

    // --------------------------------------------------
    // 5. Check organization exists
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
    // 6. Update organization
    // --------------------------------------------------

    const updatedOrganization = await prisma.organization.update({
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

    // --------------------------------------------------
    // 7. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      updatedOrganization,
      "Your organization information has been updated.",
    );
  } catch (error) {
    console.error("[updateOrganizationGeneral] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update organization information.",
      "UNKNOWN_ERROR",
    );
  }
}
