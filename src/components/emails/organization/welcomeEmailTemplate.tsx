import BaseEmailTemplate from "../baseEmail";

export function welcomeEmailTemplate({
  name,
  url,
  organizationName,
}: {
  name: string;
  url: string;
  organizationName: string;
}) {
  return (
    <BaseEmailTemplate
      previewText={`Welcome to StaffZeno — you're now part of ${organizationName}.`}
      heading="Welcome to StaffZeno"
      name={name}
      introText={`Welcome to StaffZeno! Your invitation to join ${organizationName} has been accepted, and your account is now active. You can sign in to access your workspace, view your team, and get started.`}
      url={url}
      buttonText="Go to StaffZeno"
      infoText={`You are now a member of ${organizationName}. Your available features and access are based on your role and permissions within the organization.`}
      troubleText="Having trouble accessing your workspace? Copy and paste this link into your browser:"
    />
  );
}
