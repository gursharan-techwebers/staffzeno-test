import { leaveDecisionEmailTemplate } from "@/components/emails/organization/leaveDecisionEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { LeaveDecisionEmailProps } from "@/types/email/organization";

export const sendLeaveDecisionEmail = async ({
  email,
  name,
  organizationName,
  leaveType,
  startDate,
  endDate,
  duration,
  status,
  approverName,
  reason,
  url,
}: LeaveDecisionEmailProps) => {
  try {
    const isApproved = status === "APPROVED";

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: isApproved
        ? `Your leave request has been approved`
        : `Your leave request has been rejected`,
      react: leaveDecisionEmailTemplate({
        name,
        organizationName,
        leaveType,
        startDate,
        endDate,
        duration,
        status,
        approverName,
        reason,
        url,
      }),
    });

    if (error) {
      console.error("Resend leave decision email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send leave decision email:", error);

    throw error;
  }
};