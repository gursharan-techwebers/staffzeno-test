"use client";

import { useState } from "react";
import { MailOpenIcon, Plus } from "lucide-react";

import { InvitationTable } from "./InvitationTable";
import InviteMemberDialog from "./InviteMemberDialog";
import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";

import type { Invitation } from "@/types/organization/invitation";
import EmptyState from "@/components/shared/dashboard/EmptyState";

type Team = {
  id: string;
  name: string;
};

type InvitationContentProps = {
  invitations: Invitation[];
  teams: Team[];
  defaultTeamId: string;
};

const InvitationContent = ({
  invitations: initialInvitations,
  teams,
  defaultTeamId,
}: InvitationContentProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>(
    initialInvitations.filter(
      (invitation) => invitation.status.toLowerCase() === "pending",
    ),
  );

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const handleInvitationCreated = (invitation: Invitation) => {
    if (invitation.status.toLowerCase() !== "pending") {
      return;
    }

    setInvitations((current) => [invitation, ...current]);
  };

  const handleInvitationResent = (
    oldInvitationId: string,
    newInvitation: Invitation,
  ) => {
    setInvitations((current) =>
      current.map((invitation) =>
        invitation.id === oldInvitationId ? newInvitation : invitation,
      ),
    );
  };

  const handleInvitationCancelled = (invitationId: string) => {
    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== invitationId),
    );
  };

  return (
    <>
      <DashboardPageHeader
        title="Invitations"
        description="Manage pending invitations and invite employees to your organization."
        {...(invitations.length > 0
          ? {
              actionIcon: <Plus className="size-4" />,
              actionLabel: "Invite an employee",
              onAction: () => setInviteDialogOpen(true),
            }
          : {})}
      />

      {invitations.length === 0 ? (
        <EmptyState
          icon={<MailOpenIcon className="size-6 text-muted-foreground" />}
          title="No pending invitations"
          description="You don't have any pending invitations. Invite employees to join your organization and get them set up in StaffZeno."
          actionIcon={<Plus className="size-4" />}
          actionLabel="Invite an employee"
          onAction={() => setInviteDialogOpen(true)}
        />
      ) : (
        <InvitationTable
          invitations={invitations}
          onInvitationResent={handleInvitationResent}
          onInvitationCancelled={handleInvitationCancelled}
        />
      )}

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvitationCreated={handleInvitationCreated}
        teams={teams}
        defaultTeamId={defaultTeamId}
      />
    </>
  );
};

export default InvitationContent;
