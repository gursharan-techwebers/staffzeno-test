import BaseEmailTemplate from "../baseEmail";

export function organizationRoleChangedEmailTemplate({
  name,
  organizationName,
  previousRole,
  newRole,
  url,
}: {
  name: string;
  organizationName: string;
  previousRole: string;
  newRole: string;
  url: string;
}) {
  return (
    <BaseEmailTemplate
      previewText={`Your role in ${organizationName} has been changed to ${newRole}.`}
      heading="Your role has been changed"
      name={name}
      introText={`Your role in ${organizationName} has been changed from ${previousRole} to ${newRole}. Your access and permissions within the organization may now be different.`}
      url={url}
      buttonText="View organization"
      infoText={`Your current role is ${newRole}. If you have questions about your role or access, please contact an organization administrator.`}
      troubleText="Having trouble opening your organization? Copy and paste this link into your browser:"
    />
  );
}