import { passwordResetEmailTemplate } from "@/components/emails/forgotPassword";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { VerificationEmailProps } from "@/types/email/auth";

export const sendPasswordReset = async ({
  name,
  url,
}: VerificationEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: "Reset your StaffZeno password",
      react: passwordResetEmailTemplate({
        name,
        url,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
};
