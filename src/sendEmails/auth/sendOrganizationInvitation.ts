import { invitationEmailTemplate } from "@/components/emails/inviteMember";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { InvitationEmailProps } from "@/types/email/organization";

export const sendOrganizationInvitation = async ({
  email,
  invitedByName,
  organizationName,
  inviteLink,
  title,
}: InvitationEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `You've been invited to join ${organizationName} on StaffZeno`,
      react: invitationEmailTemplate({
        email,
        invitedByName,
        organizationName,
        title,
        inviteLink,
      }),
    });

    if (error) {
      console.error("Resend invitation error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send organization invitation email:", error);

    throw error;
  }
};
