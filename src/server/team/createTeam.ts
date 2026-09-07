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
import { getSession } from "../user/getSession";

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
    const requestHeaders = await headers();

    // 1. Get current session
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to create a team.",
        "UNAUTHORIZED",
      );
    }

    // 2. Get active organization
    const activeOrganization = await auth.api.getFullOrganization({
      headers: requestHeaders,
    });

    if (!activeOrganization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You must have an active organization to create a team.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 3. Verify current user's membership
    const currentMember = activeOrganization.members.find(
      (member) => member.userId === session.user.id,
    );

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    // 4. Only owner and admin can create teams
    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have permission to create a team.",
        "FORBIDDEN",
      );
    }

    // 5. Check team's plan limit
    const canCreate = await canCreateTeam(
      session.user.id,
      activeOrganization.id,
    );

    if (!canCreate) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You have reached the team limit for your current plan. Please upgrade your plan to create another team.",
        "LIMIT_REACHED",
      );
    }

    // 6. Create team
    const team = await auth.api.createTeam({
      body: {
        name,
        organizationId: activeOrganization.id,
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

    // 7. Return success
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
    // 8. Handle Better Auth errors
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to create the team. Please try again.",
        "BAD_REQUEST",
      );
    }

    // 9. Handle unexpected errors
    console.error("[createTeam] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
