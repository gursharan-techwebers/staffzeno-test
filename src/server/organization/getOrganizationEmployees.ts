import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

export type OrganizationEmployeeRole = "admin" | "member";

export type OrganizationEmployee = {
  id: string;
  userId: string;
  role: OrganizationEmployeeRole;
  title: string | null;
  teamId: string | null;
  createdAt: Date;

  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };

  teams: {
    id: string;
    name: string;
  }[];
};

export async function getOrganizationEmployees(): Promise<
  ActionResult<OrganizationEmployee[]>
> {
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
    // 3. Only owner and admin can view employees
    // --------------------------------------------------
    if (activeMember.role !== "owner" && activeMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization admins and owners can view employees.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Get organization members
    // --------------------------------------------------
    const members = await prisma.member.findMany({
      where: {
        organizationId,

        // Do not show the organization owner
        role: {
          in: ["admin", "member"],
        },
      },

      select: {
        id: true,
        userId: true,
        role: true,
        title: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,

            // Get teams belonging to THIS organization only
            teammembers: {
              where: {
                team: {
                  organizationId,
                },
              },

              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // --------------------------------------------------
    // 5. Transform Prisma result
    // --------------------------------------------------
    const employees: OrganizationEmployee[] = members.map((member) => {
      const teams = member.user.teammembers.map(
        (teamMember) => teamMember.team,
      );

      return {
        id: member.id,
        userId: member.userId,

        role: member.role as OrganizationEmployeeRole,

        title: member.title,

        // Current team.
        // null means the employee is not assigned
        // to a team.
        teamId: teams[0]?.id ?? null,

        createdAt: member.createdAt,

        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        },

        teams,
      };
    });

    // --------------------------------------------------
    // 6. Return employees
    // --------------------------------------------------
    return actionResponse(
      ACTION_STATUS.OK,
      employees,
      "Employees loaded successfully.",
    );
  } catch (error) {
    console.error("[getOrganizationEmployees] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to load employees.",
      "UNKNOWN_ERROR",
    );
  }
}
