import BaseEmailTemplate from "../baseEmail";

export function memberRemovedEmailTemplate({
  name,
  organizationName,
  url,
}: {
  name: string;
  organizationName: string;
  url?: string;
}) {
  return (
    <BaseEmailTemplate
      previewText={`Your access to ${organizationName} has been removed.`}
      heading="Organization access removed"
      name={name}
      introText={`Your membership in ${organizationName} has been removed. You no longer have access to this organization's workspace, teams, or other organization features on StaffZeno.`}
      url={url}
      buttonText="Go to StaffZeno"
      infoText={`If you believe this was done by mistake or you need more information, please contact an administrator of ${organizationName}.`}
      troubleText="Having trouble accessing StaffZeno? Copy and paste this link into your browser:"
    />
  );
}