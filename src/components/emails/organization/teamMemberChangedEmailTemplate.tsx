import BaseEmailTemplate from "../baseEmail";

export function teamMemberChangedEmailTemplate({
  name,
  memberName,
  organizationName,
  previousTeamName,
  newTeamName,
  url,
}: {
  name: string;
  memberName: string;
  organizationName: string;
  previousTeamName?: string;
  newTeamName: string;
  url: string;
}) {
  const introText = previousTeamName
    ? `${memberName}'s team assignment has been changed from ${previousTeamName} to ${newTeamName} in ${organizationName}.`
    : `${memberName} has been added to the ${newTeamName} team in ${organizationName}.`;

  return (
    <BaseEmailTemplate
      previewText={`${memberName}'s team assignment has been updated in ${organizationName}.`}
      heading="Team membership updated"
      name={name}
      introText={introText}
      url={url}
      buttonText="View team"
      infoText={`You can review the team's members and manage team access from your StaffZeno workspace.`}
      troubleText="Having trouble opening the team? Copy and paste this link into your browser:"
    />
  );
}
