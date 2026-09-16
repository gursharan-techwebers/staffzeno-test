import BaseEmailTemplate from "../baseEmail";

export function leaveCancelledEmailTemplate({
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
  const infoText = [
    `Leave type: ${leaveType}`,
    `Dates: ${startDate} – ${endDate}`,
    `Duration: ${duration}`,
    reason ? `Employee's reason: ${reason}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <BaseEmailTemplate
      previewText={`${employeeName} has cancelled their leave request in ${organizationName}.`}
      heading="Leave request cancelled"
      name={name}
      introText={`${employeeName} has cancelled their leave request in ${organizationName}. The request no longer requires your approval.`}
      url={url}
      buttonText="Manage leave requests"
      infoText={infoText}
      troubleText="Having trouble opening the leave request? Copy and paste this link into your browser:"
    />
  );
}
