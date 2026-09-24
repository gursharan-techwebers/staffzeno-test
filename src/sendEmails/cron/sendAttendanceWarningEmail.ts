import { attendanceWarningEmailTemplate } from "@/components/emails/cron/attendanceWarningEmailTemplate";
import { env } from "@/env";
import { resend } from "@/lib/resend";

type SendAttendanceWarningEmailProps = {
  email: string;
  name: string;
  punchedInAt: Date;
  url: string;
};

export const sendAttendanceWarningEmail = async ({
  email,
  name,
  punchedInAt,
  url,
}: SendAttendanceWarningEmailProps) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || "StaffZeno <onboarding@resend.dev>",
      to: "gursharan.techwebers@gmail.com",
      subject: "Your attendance session is still active",
      react: attendanceWarningEmailTemplate({
        name,
        punchedInAt,
        url,
      }),
    });

    if (error) {
      console.error("Resend attendance warning email error:", error);

      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send attendance warning email:", error);

    throw error;
  }
};
