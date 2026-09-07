import { redirect } from "next/navigation";

import { getActiveOrganization } from "@/server/organization/getActiveOrganization";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";
import { getSession } from "@/server/user/getSession";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.emailVerified) {
    redirect("/verify");
  }

  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  const activeOrganization = await getActiveOrganization();

  const organization = activeOrganization ?? organizations[0];

  redirect(`/org/${organization.slug}`);
}
