import { PasswordResetConfirmationEmailProps } from "@/types/email/auth";
import BaseEmailTemplate from "./baseEmail";
import { env } from "@/env";

const APP_NAME = env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";

export function passwordResetConfirmationEmailTemplate({
  name,
  changedAt,
}: PasswordResetConfirmationEmailProps) {
  return (
    <BaseEmailTemplate
      previewText={`Your ${APP_NAME} password has been changed.`}
      heading="Your password has been changed"
      name={name}
      introText={`Your ${APP_NAME} password was successfully changed. If you made this change, no further action is needed.`}
      infoText={`Password changed at: ${changedAt}`}
      url={`${env.NEXT_PUBLIC_APP_URL}/change-password`}
      buttonText="Secure my account"
      troubleText={`Didn't changed your password? Secure your account immediately by choosing a new password. This will help protect your account from unauthorized access.`}
    />
  );
}
