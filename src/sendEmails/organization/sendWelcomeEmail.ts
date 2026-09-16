import { welcomeEmailTemplate } from "@/components/emails/organization/welcomeEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { WelcomeEmailProps } from "@/types/email/organization";

export const sendWelcomeEmail = async ({
  email,
  name,
  organizationName,
  url,
}: WelcomeEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Welcome to StaffZeno — You're now part of ${organizationName}`,
      react: welcomeEmailTemplate({
        name,
        organizationName,
        url,
      }),
    });

    if (error) {
      console.error("Resend welcome email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send welcome email:", error);

    throw error;
  }
};