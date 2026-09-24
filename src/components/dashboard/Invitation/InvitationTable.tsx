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
import { formatDate } from "@/lib/utils/date";
import { createStatusConfig } from "@/lib/utils/status";

type InvitationTableProps = {
  invitations: Invitation[];

  onInvitationResent?: (
    oldInvitationId: string,
    newInvitation: Invitation,
  ) => void;

  onInvitationCancelled?: (invitationId: string) => void;
};

const getRequestStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return createStatusConfig("Pending", "warning");

    case "accepted":
      return createStatusConfig("Accepted", "success");

    case "rejected":
      return createStatusConfig("Rejected", "danger");

    case "cancelled":
    case "canceled":
      return createStatusConfig("Cancelled", "danger");

    case "expired":
      return createStatusConfig("Expired", "neutral");

    default:
      return createStatusConfig(
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        "neutral",
      );
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
            const status = getRequestStatusConfig(invitation.status);

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
