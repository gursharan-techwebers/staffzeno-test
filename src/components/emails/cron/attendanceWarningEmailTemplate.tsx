import BaseEmailTemplate from "../baseEmail";
import { env } from "@/env";

const APP_NAME = env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";

type AttendanceWarningEmailProps = {
  name: string;
  punchedInAt: Date;
  url: string;
};

export function attendanceWarningEmailTemplate({
  name,
  punchedInAt,
  url,
}: AttendanceWarningEmailProps) {
  const punchedInTime = punchedInAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <BaseEmailTemplate
      previewText={`Your ${APP_NAME} attendance session is still active.`}
      heading="Your attendance session is still active"
      name={name}
      introText={`Your attendance session is still active. You punched in at ${punchedInTime}. Please punch out before the automatic attendance cutoff.`}
      url={url}
      buttonText="Go to attendance"
      infoText={`If you do not punch out before 11:50 PM (your organization's local time), ${APP_NAME} will automatically close your active attendance session. If you punch out yourself, please remember to add your work summary.`}
      troubleText="If you are already finished working, please return to your attendance page and punch out."
    />
  );
}