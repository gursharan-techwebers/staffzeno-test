import BaseEmailTemplate from "../baseEmail";

export function teamChangedEmailTemplate({
  name,
  organizationName,
  previousTeamName,
  newTeamName,
  url,
}: {
  name: string;
  organizationName: string;
  previousTeamName?: string;
  newTeamName: string;
  url: string;
}) {
  const introText = previousTeamName
    ? `Your team assignment in ${organizationName} has been changed from ${previousTeamName} to ${newTeamName}.`
    : `You have been added to the ${newTeamName} team in ${organizationName}.`;

  return (
    <BaseEmailTemplate
      previewText={`Your team assignment in ${organizationName} has been updated.`}
      heading="Your team has been updated"
      name={name}
      introText={introText}
      url={url}
      buttonText="View team"
      infoText={`You are now a member of the ${newTeamName} team. Your team-related access and responsibilities may depend on your role within the team.`}
      troubleText="Having trouble opening your team? Copy and paste this link into your browser:"
    />
  );
}