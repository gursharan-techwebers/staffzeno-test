import { leaveCancelledEmailTemplate } from "@/components/emails/organization/leaveCancelledEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { LeaveCancelledEmailProps } from "@/types/email/organization";

export const sendLeaveCancelledEmail = async ({
  email,
  name,
  employeeName,
  organizationName,
  leaveType,
  startDate,
  endDate,
  duration,
  reason,
  url,
}: LeaveCancelledEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `${employeeName} cancelled their leave request`,
      react: leaveCancelledEmailTemplate({
        name,
        employeeName,
        organizationName,
        leaveType,
        startDate,
        endDate,
        duration,
        reason,
        url,
      }),
    });

    if (error) {
      console.error("Resend leave cancelled email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send leave cancelled email:", error);

    throw error;
  }
};
