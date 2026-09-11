import { VerificationEmailProps } from "@/types/email/auth";
import BaseEmailTemplate from "./baseEmail";
import { env } from "@/env";

const APP_NAME = env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";

export function verificationEmailTemplate({
  name,
  url,
}: VerificationEmailProps) {
  return (
    <BaseEmailTemplate
      previewText={`Verify your email to activate your ${APP_NAME} account.`}
      heading="Verify your email"
      name={name}
      introText={`Thanks for signing up for ${APP_NAME}. Confirm your email address to activate your account and get started.`}
      url={url}
      buttonText="Verify email"
      infoText={`This verification link will expire soon. If you didn't create a ${APP_NAME} account, you can safely ignore this email.`}
      troubleText="Having trouble with the button? Copy and paste this link into your browser:"
    />
  );
}
