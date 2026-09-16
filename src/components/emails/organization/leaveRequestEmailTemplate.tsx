import BaseEmailTemplate from "../baseEmail";

export function leaveRequestEmailTemplate({
  name,
  employeeName,
  organizationName,
  leaveType,
  startDate,
  endDate,
  duration,
  reason,
  url,
}: {
  name: string;
  employeeName: string;
  organizationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason?: string;
  url: string;
}) {
  return (
    <BaseEmailTemplate
      previewText={`${employeeName} has submitted a ${leaveType} request for your approval.`}
      heading="Leave request requires your approval"
      name={name}
      introText={`${employeeName} has submitted a leave request in ${organizationName} and it requires your approval.`}
      url={url}
      buttonText="Review leave request"
      infoText={`Leave type: ${leaveType}\nDates: ${startDate} – ${endDate}\nDuration: ${duration}${reason ? `\nReason: ${reason}` : ""}`}
      troubleText="Having trouble opening the leave request? Copy and paste this link into your browser:"
    />
  );
}
