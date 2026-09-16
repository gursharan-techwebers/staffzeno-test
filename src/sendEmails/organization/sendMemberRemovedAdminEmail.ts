import { memberRemovedAdminEmailTemplate } from "@/components/emails/organization/memberRemovedAdminEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { MemberRemovedAdminEmailProps } from "@/types/email/organization";

export const sendMemberRemovedAdminEmail = async ({
  email,
  name,
  memberName,
  organizationName,
  url,
}: MemberRemovedAdminEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Member removed from ${organizationName}`,
      react: memberRemovedAdminEmailTemplate({
        name,
        memberName,
        organizationName,
        url,
      }),
    });

    if (error) {
      console.error("Resend member removed admin email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to send member removed admin email:",
      error,
    );

    throw error;
  }
};