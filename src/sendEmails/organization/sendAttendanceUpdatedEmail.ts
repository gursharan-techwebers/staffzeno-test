import { attendanceUpdatedEmailTemplate } from "@/components/emails/organization/attendanceUpdatedEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { AttendanceUpdatedEmailProps } from "@/types/email/organization";

export const sendAttendanceUpdatedEmail = async ({
  email,
  name,
  organizationName,
  attendanceDate,
  updatedByName,
  reason,
  sessions,
  url,
}: AttendanceUpdatedEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: `Your attendance record has been updated`,
      react: attendanceUpdatedEmailTemplate({
        name,
        organizationName,
        attendanceDate,
        updatedByName,
        reason,
        sessions,
        url,
      }),
    });

    if (error) {
      console.error("Resend attendance updated email error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send attendance updated email:", error);

    throw error;
  }
};
