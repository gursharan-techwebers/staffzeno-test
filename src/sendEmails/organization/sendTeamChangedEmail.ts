import { teamChangedEmailTemplate } from "@/components/emails/organization/teamChangedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { TeamChangedEmailProps } from "@/types/email/organization";

export const sendTeamChangedEmail = async ({
  email,
  name,
  organizationName,
  previousTeamName,
  newTeamName,
  url,
}: TeamChangedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: email,
      subject: `Your team has been updated in ${organizationName}`,
      react: teamChangedEmailTemplate({
        name,
        organizationName,
        previousTeamName,
        newTeamName,
        url,
      }),
    });

    if (error) {
      console.error("Resend team changed email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send team changed email:", error);

    throw error;
  }
};