import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo ?? null,
  }));
}
