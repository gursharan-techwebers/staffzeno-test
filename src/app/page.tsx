import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/getAuthContext";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";

export default async function Home() {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/login");
  }

  const { session, user } = authContext;

  if (!user.emailVerified) {
    redirect("/verify");
  }

  const organizations = await getUserOrganizations({
    userId: user.id,
  });

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  const activeOrganizationId = session.activeOrganizationId;

  const activeOrganization = activeOrganizationId
    ? organizations.find(
        (organization) => organization.id === activeOrganizationId,
      )
    : null;

  const organization = activeOrganization ?? organizations[0];

  redirect(`/org/${organization.slug}`);
}
