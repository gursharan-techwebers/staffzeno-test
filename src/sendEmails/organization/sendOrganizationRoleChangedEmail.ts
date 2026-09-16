import { organizationRoleChangedEmailTemplate } from "@/components/emails/organization/organizationRoleChangedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { OrganizationRoleChangedEmailProps } from "@/types/email/organization";

export const sendOrganizationRoleChangedEmail = async ({
  email,
  name,
  organizationName,
  previousRole,
  newRole,
  url,
}: OrganizationRoleChangedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Your role has changed in ${organizationName}`,
      react: organizationRoleChangedEmailTemplate({
        name,
        organizationName,
        previousRole,
        newRole,
        url,
      }),
    });

    if (error) {
      console.error("Resend organization role changed email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to send organization role changed email:",
      error,
    );

    throw error;
  }
};