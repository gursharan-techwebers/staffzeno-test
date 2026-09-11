import { PasswordResetEmailProps } from "@/types/email/auth";
import BaseEmailTemplate from "./baseEmail";
import { env } from "@/env";

const APP_NAME =
  env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";

export function passwordResetEmailTemplate({
  name,
  url,
}: PasswordResetEmailProps) {
  return (
    <BaseEmailTemplate
      previewText={`Reset your ${APP_NAME} password.`}
      heading="Reset your password"
      name={name}
      introText={`We received a request to reset your ${APP_NAME} password. Use the link below to choose a new password and regain access to your account.`}
      url={url}
      buttonText="Reset password"
      infoText={`This password reset link will expire soon. If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.`}
      troubleText="Having trouble with the button? Copy and paste this link into your browser:"
    />
  );
}