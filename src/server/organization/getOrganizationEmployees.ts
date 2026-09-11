import "server-only";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import {
  OrganizationEmployee,
  OrganizationEmployeeRole,
} from "@/types/organization/team";

type GetOrganizationEmployeesParams = {
  organizationId: string;
  userRole: string;
};

export async function getOrganizationEmployees({
  organizationId,
  userRole,
}: GetOrganizationEmployeesParams): Promise<
  ActionResult<OrganizationEmployee[]>
> {
  if (!organizationId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization context is required.",
      "BAD_REQUEST",
    );
  }

  // --------------------------------------------------
  // Authorization
  // --------------------------------------------------
  if (userRole !== "owner" && userRole !== "admin") {
    return actionResponse(
      ACTION_STATUS.FORBIDDEN,
      "Only organization admins and owners can view employees.",
      "FORBIDDEN",
    );
  }

  try {
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

            // Only teams belonging to this organization
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

    const employees: OrganizationEmployee[] = members.map((member) => {
      const teams = member.user.teammembers.map(
        (teamMember) => teamMember.team,
      );

      return {
        id: member.id,
        userId: member.userId,

        role: member.role as OrganizationEmployeeRole,

        title: member.title,

        // First team is treated as the current team.
        // null means the employee has no team.
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