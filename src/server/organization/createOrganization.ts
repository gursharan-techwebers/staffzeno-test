"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { generateOrganizationSlug } from "@/lib/utils";
import {
  CreateOrganizationInput,
  createOrganizationSchema,
} from "@/validators/organization/organization";
import { getSession } from "../user/getSession";
import { canCreateOrganization } from "../billing/canCreateOrganization";

type CreateOrganizationSuccess = {
  organizationId: string;
  name: string;
  slug: string;
  createdById: string;
};

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<ActionResult<CreateOrganizationSuccess>> {
  const parsed = createOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { name } = parsed.data;

  try {
    const requestHeaders = await headers();

    // 1. Check authentication
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to create an organization.",
        "UNAUTHORIZED",
      );
    }

    // 2. Check organization limit
    const canCreate = await canCreateOrganization(session.user.id);

    if (!canCreate) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You have reached the organization limit for your current plan. Please upgrade your plan to create another organization.",
        "LIMIT_REACHED",
      );
    }

    // 3. Generate organization slug
    const slug = generateOrganizationSlug();

    // 4. Create organization
    const organization = await auth.api.createOrganization({
      body: {
        name,
        slug,
        userId: session.user.id,
        createdById: session.user.id,
        keepCurrentActiveOrganization: true,
      },
      headers: requestHeaders,
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Unable to create the organization.",
        "BAD_REQUEST",
      );
    }

    // 5. Set newly created organization as active
    await auth.api.setActiveOrganization({
      body: {
        organizationId: organization.id,
      },
      headers: requestHeaders,
    });

    return actionResponse(
      ACTION_STATUS.CREATED,
      {
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdById: organization.createdById,
      },
      "Organization created successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Unable to create the organization. Please try again.",
        "BAD_REQUEST",
      );
    }

    console.error("[createOrganization] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
