import BaseEmailTemplate from "../baseEmail";

export function newMemberJoinedEmailTemplate({
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
      previewText={`${memberName} has joined ${organizationName} on StaffZeno.`}
      heading="New member joined"
      name={name}
      introText={`${memberName} has accepted their invitation and is now a member of ${organizationName} on StaffZeno.`}
      url={url}
      buttonText="View organization"
      infoText={`You can review ${memberName}'s membership, role, team assignment, and access from your organization settings.`}
      troubleText="Having trouble opening your organization? Copy and paste this link into your browser:"
    />
  );
}