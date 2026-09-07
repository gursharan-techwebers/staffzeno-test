import { InvitationEmailProps } from "@/types/organization/emails/organizationEmails";
import BaseEmailTemplate from "./baseEmail";

const APP_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";

export function invitationEmailTemplate({
  email,
  invitedByName,
  organizationName,
  inviteLink,
  title,
}: InvitationEmailProps) {
  return (
    <BaseEmailTemplate
      previewText={`You've been invited to join ${organizationName} on ${APP_NAME}.`}
      heading={`You've been invited to join ${organizationName}`}
      introText={`${invitedByName} has invited you to join ${organizationName} as ${title || "a member"} on ${APP_NAME}. Accept the invitation below to join the organization.`}
      url={inviteLink}
      buttonText="Accept invitation"
      infoText={`This invitation was sent to ${email}. If you weren't expecting this invitation, you can safely ignore this email.`}
      troubleText="Having trouble with the button? Copy and paste this link into your browser:"
    />
  );
}
