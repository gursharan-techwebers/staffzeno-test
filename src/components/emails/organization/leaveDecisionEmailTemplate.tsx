import BaseEmailTemplate from "../baseEmail";

export function leaveDecisionEmailTemplate({
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
}: {
  name: string;
  organizationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: "APPROVED" | "REJECTED";
  approverName: string;
  reason?: string;
  url: string;
}) {
  const isApproved = status === "APPROVED";

  const heading = isApproved
    ? "Leave request approved"
    : "Leave request rejected";

  const previewText = isApproved
    ? `Your ${leaveType} request in ${organizationName} has been approved.`
    : `Your ${leaveType} request in ${organizationName} has been rejected.`;

  const introText = isApproved
    ? `Your leave request in ${organizationName} has been approved by ${approverName}.`
    : `Your leave request in ${organizationName} has been rejected by ${approverName}.`;

  const infoText = [
    `Leave type: ${leaveType}`,
    `Dates: ${startDate} – ${endDate}`,
    `Duration: ${duration}`,
    `Decision: ${isApproved ? "Approved" : "Rejected"}`,
    reason ? `Reason: ${reason}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <BaseEmailTemplate
      previewText={previewText}
      heading={heading}
      name={name}
      introText={introText}
      url={url}
      buttonText="Manage leave requests"
      infoText={infoText}
      troubleText="Having trouble opening the leave request? Copy and paste this link into your browser:"
    />
  );
}
