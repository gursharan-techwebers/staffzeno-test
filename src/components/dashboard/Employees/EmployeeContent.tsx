"use client";

import { useState } from "react";
import { Plus, UsersIcon } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import EmptyState from "@/components/shared/dashboard/EmptyState";

import InviteMemberDialog from "../Invitation/InviteMemberDialog";
import { EmployeeTable } from "./EmployeeTable";

import type { Invitation } from "@/types/organization/invitation";
import type { TitleSchemaInput } from "@/validators/organization/common";
import { OrganizationEmployee, OrganizationEmployeeRole, TeamOption } from "@/types/organization/team";

type EmployeeContentProps = {
  employees: OrganizationEmployee[];
  teams: TeamOption[];
  organizationId: string;
  currentUserRole: "owner" | "admin" | "member";
  defaultTeamId: string;
};

const EmployeeContent = ({
  employees: initialEmployees,
  teams,
  organizationId,
  currentUserRole,
  defaultTeamId,
}: EmployeeContentProps) => {
  const [employees, setEmployees] =
    useState<OrganizationEmployee[]>(initialEmployees);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // --------------------------------------------------
  // Invitation created
  // --------------------------------------------------
  const handleInvitationCreated = (_invitation: Invitation) => {
    /*
     * Creating an invitation does not create an employee.
     *
     * The employee will appear here after accepting
     * the invitation.
     */
  };

  // --------------------------------------------------
  // Employee removed
  // --------------------------------------------------
  const handleEmployeeRemoved = (employeeId: string) => {
    setEmployees((current) =>
      current.filter((employee) => employee.id !== employeeId),
    );
  };

  // --------------------------------------------------
  // Employee updated
  // --------------------------------------------------
  const handleEmployeeUpdated = (
    memberId: string,
    updates: {
      role: OrganizationEmployeeRole;
      teamId: string | null;
      title: TitleSchemaInput;
    },
  ) => {
    setEmployees((current) =>
      current.map((employee) => {
        if (employee.id !== memberId) {
          return employee;
        }

        const updatedTeam = updates.teamId
          ? teams.find((team) => team.id === updates.teamId)
          : null;

        return {
          ...employee,
          role: updates.role,
          title: updates.title || null,
          teamId: updates.teamId,
          teams: updatedTeam ? [updatedTeam] : [],
        };
      }),
    );
  };

  const hasEmployees = employees.length > 0;

  return (
    <>
      <DashboardPageHeader
        title="Employees"
        description="Manage employees in your organization and keep your team organized."
        {...(hasEmployees && {
          actionIcon: <Plus className="size-4" />,
          actionLabel: "Invite an employee",
          onAction: () => setInviteDialogOpen(true),
        })}
      />

      {hasEmployees ? (
        <EmployeeTable
          employees={employees}
          teams={teams}
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          onEmployeeRemoved={handleEmployeeRemoved}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      ) : (
        <EmptyState
          icon={<UsersIcon className="size-6 text-muted-foreground" />}
          title="No employees yet"
          description="Your organization doesn't have any employees yet. Invite your first employee to get your team started."
          actionIcon={<Plus className="size-4" />}
          actionLabel="Invite an employee"
          onAction={() => setInviteDialogOpen(true)}
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

export default EmployeeContent;