"use server";

import { cookies } from "next/headers";

import { LAST_ACTIVE_ORGANIZATION_COOKIE } from "@/constants/organization";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Save the user's last active organization ID.
 */
export async function setLastActiveOrganizationCookie(
  organizationId: string,
): Promise<void> {
  if (!organizationId) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(LAST_ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Get the user's last active organization ID.
 */
export async function getLastActiveOrganizationCookie(): Promise<
  string | null
> {
  const cookieStore = await cookies();

  return cookieStore.get(LAST_ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}
