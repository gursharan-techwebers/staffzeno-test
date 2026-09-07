import { verificationEmailTemplate } from "@/components/emails/emailVerification";
import { resend } from "@/lib/resend";
import { VerificationEmailProps } from "@/types/auth/emails/authEmails";

export const sendVerification = async ({
  name,
  email,
  url,
}: VerificationEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: "Verify your email address",
      react: verificationEmailTemplate({
        name,
        email,
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
