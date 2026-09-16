import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/getAuthContext";
import { getPostLoginOrganization } from "@/server/organization/getPostLoginOrganization";
import { setActiveOrganizationBySlug } from "@/server/organization/setActiveOrganizationBySlug";

export default async function GoogleCallbackPage() {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/login");
  }

  const organization = await getPostLoginOrganization(authContext.user.id);

  if (!organization) {
    redirect("/");
  }

  const result = await setActiveOrganizationBySlug(
    organization.organizationSlug,
    true, // skip cookie
  );

  if (!result.success) {
    redirect("/");
  }

  redirect(`/org/${organization.organizationSlug}`);
}
