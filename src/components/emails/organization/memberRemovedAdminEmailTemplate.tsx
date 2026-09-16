import BaseEmailTemplate from "../baseEmail";

export function memberRemovedAdminEmailTemplate({
  name,
  memberName,
  organizationName,
  url,
}: {
  name: string;
  memberName: string;
  organizationName: string;
  url: string;
}) {
  return (
    <BaseEmailTemplate
      previewText={`${memberName} has been removed from ${organizationName}.`}
      heading="Member removed"
      name={name}
      introText={`${memberName} has been removed from ${organizationName} and no longer has access to the organization's StaffZeno workspace.`}
      url={url}
      buttonText="View organization"
      infoText={`You can review the organization's members, teams, and access settings from your StaffZeno workspace.`}
      troubleText="Having trouble opening your organization? Copy and paste this link into your browser:"
    />
  );
}
