import { leaveRequestEmailTemplate } from "@/components/emails/organization/leaveRequestEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { LeaveRequestEmailProps } from "@/types/email/organization";

export const sendLeaveRequestEmail = async ({
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
}: LeaveRequestEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Leave request from ${employeeName} requires your approval`,
      react: leaveRequestEmailTemplate({
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
      console.error("Resend leave request email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send leave request email:", error);

    throw error;
  }
};