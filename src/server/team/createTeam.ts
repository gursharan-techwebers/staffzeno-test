"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import {
  CreateTeamInput,
  createTeamSchema,
} from "@/validators/organization/team";

import { canCreateTeam } from "../billing/canCreateTeam";
import { getAuthContext } from "../auth/getAuthContext";
import { prisma } from "@/lib/prisma";

type CreateTeamSuccess = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: Date;
  members: [];
};

export async function createTeam(
  input: CreateTeamInput,
): Promise<ActionResult<CreateTeamSuccess>> {
  // --------------------------------------------------
  // 1. Validate input
  // --------------------------------------------------

  const parsed = createTeamSchema.safeParse(input);

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
    // --------------------------------------------------
    // 2. Get authenticated user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to create a team.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 3. Get active organization
    // --------------------------------------------------

    const organizationId =
      session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You must have an active organization to create a team.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 4. Verify organization membership + role
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    if (
      currentMember.role !== "owner" &&
      currentMember.role !== "admin"
    ) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have permission to create a team.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Check plan limit
    // --------------------------------------------------

    const canCreate = await canCreateTeam(
      user.id,
      organizationId,
    );

    if (!canCreate) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You have reached the team limit for your current plan. Please upgrade your plan to create another team.",
        "LIMIT_REACHED",
      );
    }

    // --------------------------------------------------
    // 6. Create team through Better Auth
    // --------------------------------------------------

    const requestHeaders = await headers();

    const team = await auth.api.createTeam({
      body: {
        name,
        organizationId,
      },
      headers: requestHeaders,
    });

    if (!team) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Unable to create the team.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 7. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        id: team.id,
        name: team.name,
        memberCount: 0,
        createdAt: team.createdAt,
        members: [],
      },
      "Team created successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Unable to create the team. Please try again.",
        "BAD_REQUEST",
      );
    }

    console.error(
      "[createTeam] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}