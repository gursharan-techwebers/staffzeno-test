export interface InvitationEmailProps {
  email: string;
  invitedByName: string;
  organizationName: string;
  inviteLink: string;
  title: string;
}

export type AfterAddMemberParams = {
  member: {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type WelcomeEmailProps = {
  email: string;
  name: string;
  organizationName: string;
  url: string;
};

export type NewMemberJoinedEmailProps = {
  email: string;
  name: string;
  memberName: string;
  organizationName: string;
  url: string;
};

export type MemberRemovedEmailProps = {
  email: string;
  name: string;
  organizationName: string;
};

export type MemberRemovedAdminEmailProps = {
  email: string;
  name: string;
  memberName: string;
  organizationName: string;
  url: string;
};

export type OrganizationRoleChangedEmailProps = {
  email: string;
  name: string;
  organizationName: string;
  previousRole: string;
  newRole: string;
  url: string;
};

export type TeamChangedEmailProps = {
  email: string;
  name: string;
  organizationName: string;
  previousTeamName?: string;
  newTeamName: string;
  url: string;
};

export type TeamMemberChangedEmailProps = {
  email: string;
  name: string;
  memberName: string;
  organizationName: string;
  previousTeamName?: string;
  newTeamName: string;
  url: string;
};

export type LeaveRequestEmailProps = {
  email: string;
  name: string;
  employeeName: string;
  organizationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason?: string;
  url: string;
};

export type LeaveDecisionEmailProps = {
  email: string;
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
};

export type LeaveCancelledEmailProps = {
  email: string;
  name: string;
  employeeName: string;
  organizationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason?: string;
  url: string;
};

export type AttendanceUpdatedEmailProps = {
  email: string;
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
};