import { passwordResetConfirmationEmailTemplate } from "@/components/emails/resetPassword";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { PasswordResetConfirmationEmailProps } from "@/types/email/auth";

export const sendPasswordResetConfirmation = async ({
  name,
  email,
  changedAt,
}: PasswordResetConfirmationEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: "Your StaffZeno password has been changed",
      react: passwordResetConfirmationEmailTemplate({
        name,
        email,
        changedAt,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send password change confirmation email:", error);

    throw error;
  }
};
