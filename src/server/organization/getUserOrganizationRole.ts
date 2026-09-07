import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getSession } from "../user/getSession";

export type OrganizationRole = "owner" | "admin" | "member";

export async function getUserOrganizationRole(): Promise<
  ActionResult<OrganizationRole>
> {
  try {
    const requestHeaders = await headers();

    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const member = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    return actionResponse(ACTION_STATUS.OK, member.role as OrganizationRole);
  } catch (error) {
    console.error("[getUserOrganizationRole] error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to determine your organization role.",
      "UNKNOWN_ERROR",
    );
  }
}
