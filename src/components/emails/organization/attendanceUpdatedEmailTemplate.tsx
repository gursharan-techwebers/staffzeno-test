import BaseEmailTemplate from "../baseEmail";

export function attendanceUpdatedEmailTemplate({
  name,
  organizationName,
  attendanceDate,
  updatedByName,
  reason,
  sessions,
  url,
}: {
  name: string;
  organizationName: string;
  attendanceDate: string;
  updatedByName: string;
  reason: string;
  sessions: {
    sessionNumber: number;
    startTime: string;
    endTime: string;
    breaks?: {
      startTime: string;
      endTime: string;
    }[];
  }[];
  url: string;
}) {
  const sessionText = sessions
    .map((session) => {
      const lines = [
        `Session ${session.sessionNumber}: ${session.startTime} – ${session.endTime}`,
      ];

      if (session.breaks?.length) {
        session.breaks.forEach((breakItem, index) => {
          lines.push(
            `Break ${index + 1}: ${breakItem.startTime} – ${breakItem.endTime}`,
          );
        });
      }

      return lines.join("\n");
    })
    .join("\n\n");

  const infoText = [
    `Attendance date: ${attendanceDate}`,
    `Updated by: ${updatedByName}`,
    `Reason: ${reason}`,
    "",
    "Updated work timings:",
    sessionText,
  ].join("\n");

  return (
    <BaseEmailTemplate
      previewText={`Your attendance record for ${attendanceDate} has been updated.`}
      heading="Attendance record updated"
      name={name}
      introText={`Your attendance record for ${attendanceDate} at ${organizationName} has been updated by ${updatedByName}.`}
      url={url}
      buttonText="View attendance"
      infoText={infoText}
      troubleText="Having trouble opening your attendance record? Copy and paste this link into your browser:"
    />
  );
}
