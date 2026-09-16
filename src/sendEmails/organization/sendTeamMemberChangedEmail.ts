import { teamMemberChangedEmailTemplate } from "@/components/emails/organization/teamMemberChangedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { TeamMemberChangedEmailProps } from "@/types/email/organization";

export const sendTeamMemberChangedEmail = async ({
  email,
  name,
  memberName,
  organizationName,
  previousTeamName,
  newTeamName,
  url,
}: TeamMemberChangedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: email,
      subject: `Team membership updated in ${organizationName}`,
      react: teamMemberChangedEmailTemplate({
        name,
        memberName,
        organizationName,
        previousTeamName,
        newTeamName,
        url,
      }),
    });

    if (error) {
      console.error("Resend team member changed email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to send team member changed email:",
      error,
    );

    throw error;
  }
};