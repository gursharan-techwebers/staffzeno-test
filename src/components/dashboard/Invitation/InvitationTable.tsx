"use client";

import {
  MoreHorizontalIcon,
  RefreshCwIcon,
  XCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cancelInvitation } from "@/server/organization/cancelInvitation";
import { resendInvitation } from "@/server/organization/resendInvitation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Invitation } from "@/types/organization/invitation";

type InvitationTableProps = {
  invitations: Invitation[];

  onInvitationResent?: (
    oldInvitationId: string,
    newInvitation: Invitation,
  ) => void;

  onInvitationCancelled?: (invitationId: string) => void;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return {
        label: "Pending",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
        icon: Clock3Icon,
      };

    case "accepted":
      return {
        label: "Accepted",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
        icon: CheckCircle2Icon,
      };

    case "rejected":
    case "cancelled":
    case "canceled":
      return {
        label: status.toLowerCase() === "rejected" ? "Rejected" : "Cancelled",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
        icon: XCircleIcon,
      };

    case "expired":
      return {
        label: "Expired",
        className: "border-border bg-muted text-muted-foreground",
        icon: Clock3Icon,
      };

    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        className: "border-border bg-muted text-muted-foreground",
        icon: Clock3Icon,
      };
  }
};

export function InvitationTable({
  invitations,
  onInvitationResent,
  onInvitationCancelled,
}: InvitationTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  const handleResend = async (invitationId: string) => {
    try {
      setActionId(invitationId);

      const result = await resendInvitation(invitationId);

      if (!result.success) {
        toast.error("Unable to resend invitation", {
          description: result.error,
        });

        return;
      }

      toast.success("Invitation resent", {
        description: `A new invitation has been sent to ${result.data.email}.`,
      });

      onInvitationResent?.(invitationId, result.data);
    } catch (error) {
      console.error("[InvitationTable] resend error:", error);

      toast.error("Unable to resend invitation", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      setActionId(invitationId);

      const result = await cancelInvitation(invitationId);

      if (!result.success) {
        toast.error("Unable to cancel invitation", {
          description: result.error,
        });

        return;
      }

      toast.success("Invitation cancelled", {
        description: "The invitation has been cancelled.",
      });

      onInvitationCancelled?.(invitationId);
    } catch (error) {
      console.error("[InvitationTable] cancel error:", error);

      toast.error("Unable to cancel invitation", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-medium">Email</TableHead>

            <TableHead className="font-medium">Role</TableHead>

            <TableHead className="font-medium">Status</TableHead>

            <TableHead className="font-medium">Sent</TableHead>

            <TableHead className="font-medium">Expires</TableHead>

            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {invitations.map((invitation) => {
            const status = getStatusConfig(invitation.status);

            const StatusIcon = status.icon;

            return (
              <TableRow
                key={invitation.id}
                className="transition-colors hover:bg-muted/30"
              >
                {/* Email */}
                <TableCell className="font-medium">
                  {invitation.email}
                </TableCell>

                {/* Role */}
                <TableCell className="capitalize text-muted-foreground">
                  {invitation.role ?? "Member"}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`gap-1.5 font-medium ${status.className}`}
                  >
                    <StatusIcon className="size-3.5" />
                    {status.label}
                  </Badge>
                </TableCell>

                {/* Sent */}
                <TableCell className="text-muted-foreground">
                  {formatDate(invitation.createdAt)}
                </TableCell>

                {/* Expires */}
                <TableCell className="text-muted-foreground">
                  {formatDate(invitation.expiresAt)}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />

                        <span className="sr-only">Open invitation actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {invitation.status.toLowerCase() === "pending" && (
                        <>
                          <DropdownMenuItem
                            disabled={actionId === invitation.id}
                            onClick={() => handleResend(invitation.id)}
                          >
                            <RefreshCwIcon
                              className={`size-4 ${
                                actionId === invitation.id ? "animate-spin" : ""
                              }`}
                            />
                            Resend invitation
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            disabled={actionId === invitation.id}
                            onClick={() => handleCancel(invitation.id)}
                          >
                            <XCircleIcon className="size-4" />
                            Cancel invitation
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
