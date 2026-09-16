import { memberRemovedEmailTemplate } from "@/components/emails/organization/memberRemovedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { MemberRemovedEmailProps } from "@/types/email/organization";

export const sendMemberRemovedEmail = async ({
  email,
  name,
  organizationName,
}: MemberRemovedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Your access to ${organizationName} has been removed`,
      react: memberRemovedEmailTemplate({
        name,
        organizationName,
      }),
    });

    if (error) {
      console.error("Resend member removed email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send member removed email:", error);

    throw error;
  }
};