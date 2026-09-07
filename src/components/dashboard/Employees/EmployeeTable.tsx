"use client";

import { useState } from "react";

import {
  MailIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  Trash2Icon,
  User,
  UserIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";

import { deleteMember } from "@/server/organization/deleteMember";

import type { OrganizationEmployee } from "@/server/organization/getOrganizationEmployees";

import { Spinner } from "@/components/ui/spinner";
import { ManageEmployeeDialog } from "./ManageEmployeeDialog";
import { titleSchemaInput } from "@/validators/organization/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SharedAvatar from "@/components/shared/SharedAvatar";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type Team = {
  id: string;
  name: string;
};

type EmployeeTableProps = {
  employees: OrganizationEmployee[];
  teams: Team[];
  organizationId: string;
  currentUserRole: "owner" | "admin" | "member";
  onEmployeeRemoved: (employeeId: string) => void;
  onEmployeeUpdated: (
    memberId: string,
    updates: {
      role: "admin" | "member";
      teamId: string | null;
      title: titleSchemaInput;
    },
  ) => void;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const EmployeeTable = ({
  employees,
  teams,
  organizationId,
  currentUserRole,
  onEmployeeRemoved,
  onEmployeeUpdated,
}: EmployeeTableProps) => {
  const [actionId, setActionId] = useState<string | null>(null);

  const [employeeToRemove, setEmployeeToRemove] =
    useState<OrganizationEmployee | null>(null);

  const [employeeToManage, setEmployeeToManage] =
    useState<OrganizationEmployee | null>(null);

  const isOwner = currentUserRole === "owner";

  const isOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";

  const handleRemoveEmployee = async (memberId: string) => {
    try {
      setActionId(memberId);

      const result = await deleteMember(organizationId, memberId);

      if (!result.success) {
        toast.error("Unable to remove employee", {
          description: result.error,
        });

        return;
      }

      onEmployeeRemoved(memberId);

      toast.success("Employee removed", {
        description: "The employee has been removed from the organization.",
      });
    } catch (error) {
      console.error("[EmployeeTable] remove employee error:", error);

      toast.error("Unable to remove employee", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-medium">Employee</TableHead>

            <TableHead className="font-medium">Contact</TableHead>

            <TableHead className="font-medium">Organization Role</TableHead>

            <TableHead className="font-medium">Team</TableHead>

            <TableHead className="font-medium">Joined</TableHead>

            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {employees.map((employee) => {
            const isUpdating = actionId === employee.id;

            const primaryTeam = employee.teams?.[0];

            return (
              <TableRow
                key={employee.id}
                className="transition-colors hover:bg-muted/30"
              >
                {/* Employee */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage
                        src={employee.user.image ?? undefined}
                        alt={employee.user.name}
                      />

                      <AvatarFallback>
                        {getInitials(employee.user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {employee.user.name}

                        <span className="ml-2 text-sm text-muted-foreground">
                          {employee.title ? `(${employee.title})` : ""}
                        </span>
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Contact */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-3.5 text-muted-foreground" />

                    <span className="text-sm text-muted-foreground">
                      {employee.user.email}
                    </span>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      employee.role === "admin"
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                        : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
                    }
                  >
                    {employee.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </TableCell>

                {/* Team */}
                <TableCell>
                  {primaryTeam ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{primaryTeam.name}</span>

                      {employee.teams.length > 1 && (
                        <Badge variant="secondary" className="px-1.5 text-xs">
                          +{employee.teams.length - 1}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No team
                    </span>
                  )}
                </TableCell>

                {/* Joined */}
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(employee.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isUpdating}
                      >
                        <MoreHorizontalIcon className="size-4" />

                        <span className="sr-only">Open employee actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {isOwnerOrAdmin && (
                        <DropdownMenuItem
                          disabled={isUpdating}
                          onClick={() => setEmployeeToManage(employee)}
                        >
                          <Settings2Icon className="size-4" />
                          Manage
                        </DropdownMenuItem>
                      )}

                      {isOwner && (
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isUpdating}
                          onClick={() => setEmployeeToRemove(employee)}
                        >
                          <Trash2Icon className="size-4" />
                          Remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Remove Employee Confirmation */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => {
          if (!open && !actionId) {
            setEmployeeToRemove(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee?</AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently remove the following employee from your
              organization and immediately revoke their access.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          {employeeToRemove && (
            <div className="rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src={employeeToRemove.user.image ?? undefined}
                    alt={employeeToRemove.user.name}
                  />

                  <AvatarFallback>
                    <UserIcon className="size-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {employeeToRemove.user.name}
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {employeeToRemove.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel
              disabled={!!actionId}
              className="mt-0 flex-1"
              onClick={() => setEmployeeToRemove(null)}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="flex-1"
              disabled={!!actionId}
              onClick={async () => {
                if (!employeeToRemove) return;

                const employeeId = employeeToRemove.id;

                await handleRemoveEmployee(employeeId);

                setEmployeeToRemove(null);
              }}
            >
              {actionId === employeeToRemove?.id ? (
                <>
                  <Spinner className="size-5" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Employee */}
      <ManageEmployeeDialog
        employee={employeeToManage}
        organizationId={organizationId}
        teams={teams}
        open={!!employeeToManage}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToManage(null);
          }
        }}
        onEmployeeUpdated={onEmployeeUpdated}
      />
    </div>
  );
};

export { EmployeeTable };
