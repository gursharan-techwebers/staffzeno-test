import { newMemberJoinedEmailTemplate } from "@/components/emails/organization/newMemberJoinedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { NewMemberJoinedEmailProps } from "@/types/email/organization";

export const sendNewMemberJoinedEmail = async ({
  email,
  name,
  memberName,
  organizationName,
  url,
}: NewMemberJoinedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `New member joined ${organizationName}`,
      react: newMemberJoinedEmailTemplate({
        name,
        memberName,
        organizationName,
        url,
      }),
    });

    if (error) {
      console.error("Resend new member email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send new member joined email:", error);

    throw error;
  }
};
