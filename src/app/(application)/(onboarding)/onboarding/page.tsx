import { redirect } from "next/navigation";

import OnboardingChoice from "@/components/organization/onboarding-choice";
import { getAuthContext } from "@/server/auth/getAuthContext";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";

const OnboardingPage = async () => {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/login");
  }

  const { user } = authContext;

  // Email must be verified
  if (!user.emailVerified) {
    redirect("/verify");
  }

  // Check organization membership
  const organizations = await getUserOrganizations({
    userId: user.id,
  });

  // User already belongs to an organization
  if (organizations.length > 0) {
    redirect(`/org/${organizations[0].slug}`);
  }

  // User has no organization yet
  return <OnboardingChoice />;
};

export default OnboardingPage;
