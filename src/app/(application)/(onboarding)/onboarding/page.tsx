import OnboardingChoice from "@/components/organization/onboarding-choice";
import { getUserOrganizations } from "@/server/organization/getUserOrganizations";
import { getSession } from "@/server/user/getSession";
import { redirect } from "next/navigation";

const OnboardingPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Email must be verified
  if (!session.user.emailVerified) {
    redirect("/verify");
  }

  // Check organization membership
  const organizations = await getUserOrganizations();

  // User already belongs to an organization
  if (organizations.length > 0) {
    const organization = organizations[0];

    redirect(`/org/${organization.slug}`);
  }

  // User has no organization yet
  return <OnboardingChoice />;
};

export default OnboardingPage;
